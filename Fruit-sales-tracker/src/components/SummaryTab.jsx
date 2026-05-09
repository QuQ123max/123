import { useState } from 'react'
import { inp } from '../App'

export default function SummaryTab({ transactions, fruits, customers }) {
  const years = [...new Set(transactions.map(t => t.date.slice(0, 4)))].sort().reverse()
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState('all')
  const months = ['all','01','02','03','04','05','06','07','08','09','10','11','12']
  const mn = { all:'全年','01':'1月','02':'2月','03':'3月','04':'4月','05':'5月','06':'6月','07':'7月','08':'8月','09':'9月','10':'10月','11':'11月','12':'12月' }

  const filtered = transactions.filter(t => {
    if (t.date.slice(0, 4) !== year) return false
    if (month !== 'all' && t.date.slice(5, 7) !== month) return false
    return true
  })

  const totalCost = filtered.reduce((s, t) => s + t.cost, 0)
  const totalRev = filtered.reduce((s, t) => s + t.total_revenue, 0)
  const totalProfit = filtered.reduce((s, t) => s + t.profit, 0)
  const totalUnits = filtered.reduce((s, t) => s + t.items.reduce((ss, i) => ss + (+i.qty || 0), 0), 0)
  const unpaid = filtered.filter(t => !t.paid).reduce((s, t) => s + t.total_revenue, 0)

  const statCard = (label, val, color = '#2d6a2d') => (
    <div style={{ background: '#f1f8f1', border: '1px solid #a5d6a7', borderRadius: 8, padding: '12px 18px', minWidth: 130, textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={year} onChange={e => setYear(e.target.value)} style={inp}>
          {years.length ? years.map(y => <option key={y} value={y}>{y}年</option>) : <option value={year}>{year}年</option>}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} style={inp}>
          {months.map(m => <option key={m} value={m}>{mn[m]}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {statCard('销售数量', totalUnits)}
        {statCard('总成本', Math.round(totalCost) + '元')}
        {statCard('总收入', Math.round(totalRev) + '元')}
        {statCard('总利润', Math.round(totalProfit) + '元', totalProfit >= 0 ? '#2d6a2d' : '#c00')}
        {statCard('未收款', Math.round(unpaid) + '元', '#e65100')}
      </div>
      <h3>月度明细</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ background: '#e8f5e9' }}>
          {['月份','交易次数','销售数量','成本','收入','利润','未收款'].map(h =>
            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #a5d6a7' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {months.slice(1).map(m => {
            const mTx = transactions.filter(t => t.date.slice(0,4)===year && t.date.slice(5,7)===m)
            if (!mTx.length) return null
            const mUnits = mTx.reduce((s,t)=>s+t.items.reduce((ss,i)=>ss+(+i.qty||0),0),0)
            const mCost = mTx.reduce((s,t)=>s+t.cost,0)
            const mRev = mTx.reduce((s,t)=>s+t.total_revenue,0)
            const mProfit = mTx.reduce((s,t)=>s+t.profit,0)
            const mUnpaid = mTx.filter(t=>!t.paid).reduce((s,t)=>s+t.total_revenue,0)
            return (
              <tr key={m} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 10px' }}>{year}年{mn[m]}</td>
                <td style={{ padding: '8px 10px' }}>{mTx.length}</td>
                <td style={{ padding: '8px 10px' }}>{mUnits}</td>
                <td style={{ padding: '8px 10px' }}>{Math.round(mCost)}元</td>
                <td style={{ padding: '8px 10px' }}>{Math.round(mRev)}元</td>
                <td style={{ padding: '8px 10px', color: mProfit>=0?'#2d6a2d':'#c00', fontWeight:600 }}>{Math.round(mProfit)}元</td>
                <td style={{ padding: '8px 10px', color: mUnpaid>0?'#e65100':'#888' }}>{Math.round(mUnpaid)}元</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}