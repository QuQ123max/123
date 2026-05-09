import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import TransactionsTab from './components/TransactionsTab'
import SummaryTab from './components/SummaryTab'
import CustomersTab from './components/CustomersTab'
import FruitsTab from './components/FruitsTab'
import SettingsTab from './components/SettingsTab'

const TABS = ['交易记录', '汇总', '客户', '水果', '设置']
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'xiao0715'

export const inp = { padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }
export const lbl = { display: 'block', fontSize: 12, color: '#555', marginBottom: 3 }
export function btnStyle(bg, size) {
  return {
    padding: size === 'small' ? '4px 10px' : '8px 16px',
    background: bg, color: '#fff', border: 'none', borderRadius: 6,
    cursor: 'pointer', fontSize: size === 'small' ? 12 : 14, fontWeight: 600
  }
}

function exportToXLS(transactions, fruits, customers) {
  const rows = [['日期','客户','类型','商品明细','成本(元)','收入(元)','利润(元)','付款状态']]
  transactions.forEach(tx => {
    const cust = customers.find(c => c.id === tx.customer_id)
    const items = tx.items.map(it => {
      const f = fruits.find(f => f.id === it.fruitId)
      return `${f ? f.name : '?'}×${it.qty}${it.gift ? '🎁' : ''}`
    }).join('; ')
    rows.push([tx.date, cust?.name ?? '未知', cust?.type ?? '', items,
      Math.round(tx.cost), Math.round(tx.total_revenue), Math.round(tx.profit),
      tx.paid ? '已付款' : '未付款'])
  })
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [10,14,8,40,10,10,10,10].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '销售记录')
  XLSX.writeFile(wb, `水果销售记录_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export default function App() {
  const [tab, setTab] = useState('交易记录')
  const [fruits, setFruits] = useState([])
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPwd, setAdminPwd] = useState('')
  const [adminErr, setAdminErr] = useState('')

  async function loadAll() {
    const [{ data: t }, { data: f }, { data: c }] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('fruits').select('*'),
      supabase.from('customers').select('*'),
    ])
    setTransactions(t || [])
    setFruits(f || [])
    setCustomers(c || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadAll())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  function handleAdminLogin() {
    if (adminPwd === ADMIN_PASSWORD) {
      setShowAdminModal(false); setAdminPwd(''); setAdminErr('')
      exportToXLS(transactions, fruits, customers)
    } else { setAdminErr('密码错误，请重试。') }
  }

  if (loading) return (
    <div style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center', color: '#2d6a2d' }}>
      <div style={{ fontSize: 40 }}>🍎</div>
      <div style={{ marginTop: 12 }}>正在加载数据…</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ color: '#2d6a2d', margin: 0 }}>🍎 水果销售记录</h1>
        <button onClick={() => setShowAdminModal(true)} style={{ ...btnStyle('#1565c0'), display: 'flex', alignItems: 'center', gap: 6 }}>
          📥 导出 XLS
        </button>
      </div>
      <p style={{ color: '#888', fontSize: 12, marginTop: 4, marginBottom: 16 }}>多人实时共享数据。导出需要管理员密码。</p>

      {showAdminModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginTop: 0, color: '#1565c0' }}>🔐 管理员登录</h3>
            <p style={{ fontSize: 13, color: '#555' }}>请输入管理员密码以导出所有数据为 Excel 文件。</p>
            <label style={lbl}>管理员密码</label>
            <input type="password" value={adminPwd}
              onChange={e => { setAdminPwd(e.target.value); setAdminErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              style={{ ...inp, width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
              placeholder="输入密码…" autoFocus />
            {adminErr && <div style={{ color: '#c00', fontSize: 13, marginBottom: 8 }}>{adminErr}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleAdminLogin} style={{ ...btnStyle('#1565c0'), flex: 1 }}>确认导出</button>
              <button onClick={() => { setShowAdminModal(false); setAdminPwd(''); setAdminErr('') }} style={{ ...btnStyle('#888'), flex: 1 }}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#2d6a2d' : '#e8f5e9', color: tab === t ? '#fff' : '#2d6a2d',
            fontWeight: tab === t ? 700 : 400, fontSize: 14
          }}>{t}</button>
        ))}
      </div>

      {tab === '交易记录' && <TransactionsTab fruits={fruits} customers={customers} transactions={transactions} reload={loadAll} />}
      {tab === '汇总' && <SummaryTab transactions={transactions} fruits={fruits} customers={customers} />}
      {tab === '客户' && <CustomersTab customers={customers} transactions={transactions} fruits={fruits} reload={loadAll} />}
      {tab === '水果' && <FruitsTab fruits={fruits} reload={loadAll} />}
      {tab === '设置' && <SettingsTab reload={loadAll} />}
    </div>
  )
}
