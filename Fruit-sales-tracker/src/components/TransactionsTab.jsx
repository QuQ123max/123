import { useState } from 'react'
import { supabase } from '../supabase'
import { inp, lbl, btnStyle } from '../App'

function genId() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export default function TransactionsTab({ fruits, customers, transactions, reload }) {
  const emptyForm = {
    customerId: '', date: new Date().toISOString().slice(0, 10),
    paid: false, totalRevenue: '', items: [{ fruitId: '', qty: 1, gift: false }]
  }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)

  function calcCost(items) {
    return items.reduce((s, it) => {
      const f = fruits.find(f => f.id === it.fruitId)
      return s + (f && it.qty ? f.cost * it.qty : 0)
    }, 0)
  }

  const isGiftOnly = form.items.length > 0 && form.items.every(i => i.gift)

  async function save() {
    if (!form.customerId || form.items.some(i => !i.fruitId || !i.qty)) return alert('请填写所有字段。')
    if (!isGiftOnly && (form.totalRevenue === '' || isNaN(+form.totalRevenue))) return alert('请填写本单售价。')
    const cost = calcCost(form.items)
    const revenue = isGiftOnly ? 0 : +form.totalRevenue
    const profit = revenue - cost
    const row = {
      customer_id: form.customerId, date: form.date, paid: form.paid,
      total_revenue: revenue, cost, profit, items: form.items
    }
    setSaving(true)
    if (editId) {
      await supabase.from('transactions').update(row).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('transactions').insert({ id: genId(), ...row })
    }
    await reload()
    setSaving(false)
    setForm(emptyForm); setShowForm(false)
  }

  function edit(tx) {
    setForm({ customerId: tx.customer_id, date: tx.date, paid: tx.paid, totalRevenue: tx.total_revenue, items: tx.items })
    setEditId(tx.id); setShowForm(true)
  }

  async function del(id) {
    if (!confirm('确定删除？')) return
    await supabase.from('transactions').delete().eq('id', id)
    reload()
  }

  async function togglePaid(tx) {
    await supabase.from('transactions').update({ paid: !tx.paid }).eq('id', tx.id)
    reload()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { fruitId: '', qty: 1, gift: false }] })) }
  function removeItem(i) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }
  function setItem(i, k, v) { setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } }) }

  const filtered = filter
    ? transactions.filter(t => { const c = customers.find(c => c.id === t.customer_id); return c?.name.toLowerCase().includes(filter.toLowerCase()) })
    : transactions

  const previewCost = calcCost(form.items)
  const previewRev = isGiftOnly ? 0 : (+form.totalRevenue || 0)
  const previewProfit = previewRev - previewCost

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <input placeholder="按客户名称搜索..." value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', width: 220 }} />
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true) }} style={btnStyle('#2d6a2d')}>+ 新建交易</button>
      </div>

      {showForm && (
        <div style={{ background: '#f1f8f1', border: '1px solid #a5d6a7', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{editId ? '编辑' : '新建'}交易</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <label style={lbl}>客户</label>
              <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} style={inp}>
                <option value="">请选择...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}（{c.type}）</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>日期</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="checkbox" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} />已付款
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>商品明细</strong>
            {form.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <select value={it.fruitId} onChange={e => setItem(i, 'fruitId', e.target.value)} style={{ ...inp, width: 140 }}>
                  <option value="">选择水果...</option>
                  {fruits.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <input type="number" min="1" value={it.qty} onChange={e => setItem(i, 'qty', +e.target.value)} style={{ ...inp, width: 70 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input type="checkbox" checked={!!it.gift} onChange={e => setItem(i, 'gift', e.target.checked)} />赠送
                </label>
                {form.items.length > 1 && <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer', fontSize: 18 }}>×</button>}
              </div>
            ))}
            <button onClick={addItem} style={{ marginTop: 8, ...btnStyle('#555', 'small') }}>+ 添加水果</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>本单总售价</label>
            {isGiftOnly
              ? <div style={{ padding: '7px 10px', borderRadius: 6, background: '#e8f5e9', fontSize: 14, color: '#2d6a2d', display: 'inline-block' }}>全部赠送，售价为 0 元</div>
              : <input type="number" min="0" value={form.totalRevenue} onChange={e => setForm(f => ({ ...f, totalRevenue: e.target.value }))} style={{ ...inp, width: 160 }} placeholder="输入售价（元）" />
            }
          </div>
          <div style={{ background: '#fff', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 13, display: 'flex', gap: 20 }}>
            <span>成本：<strong>{Math.round(previewCost)}元</strong></span>
            <span>收入：<strong>{Math.round(previewRev)}元</strong></span>
            <span>利润：<strong style={{ color: previewProfit >= 0 ? '#2d6a2d' : '#c00' }}>{Math.round(previewProfit)}元</strong></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={btnStyle('#2d6a2d')}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={btnStyle('#888')}>取消</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? <p style={{ color: '#888' }}>暂无交易记录。</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#e8f5e9' }}>
                {['日期','客户','商品明细','成本','收入','利润','付款状态','操作'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #a5d6a7' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const cust = customers.find(c => c.id === tx.customer_id)
                return (
                  <tr key={tx.id} style={{ background: tx.paid ? '#e8f5e9' : '#fff3f3', borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 10px' }}>{tx.date}</td>
                    <td style={{ padding: '8px 10px' }}>{cust?.name ?? '未知'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {tx.items.map((it, i) => {
                        const f = fruits.find(f => f.id === it.fruitId)
                        return <div key={i}>{f?.name ?? '？'} × {it.qty}{it.gift ? ' 🎁' : ''}</div>
                      })}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{Math.round(tx.cost)}元</td>
                    <td style={{ padding: '8px 10px' }}>{Math.round(tx.total_revenue)}元</td>
                    <td style={{ padding: '8px 10px', color: tx.profit >= 0 ? '#2d6a2d' : '#c00', fontWeight: 600 }}>{Math.round(tx.profit)}元</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span onClick={() => togglePaid(tx)} style={{
                        cursor: 'pointer', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: tx.paid ? '#2d6a2d' : '#e53935', color: '#fff'
                      }}>{tx.paid ? '✓ 已付款' : '✗ 未付款'}</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <button onClick={() => edit(tx)} style={{ marginRight: 4, ...btnStyle('#1565c0', 'small') }}>编辑</button>
                      <button onClick={() => del(tx.id)} style={btnStyle('#c00', 'small')}>删除</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
