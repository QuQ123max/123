import { useState } from 'react'
import { supabase } from '../supabase'
import { inp, btnStyle } from '../App'

function genId() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export default function CustomersTab({ customers, transactions, fruits, reload }) {
  const [form, setForm] = useState({ name: '', type: 'C端' })
  const [sel, setSel] = useState(null)

  async function add() {
    if (!form.name.trim()) return
    await supabase.from('customers').insert({ id: genId(), ...form })
    setForm({ name: '', type: 'C端' }); reload()
  }
  async function del(id) {
    if (!confirm('确定删除该客户？')) return
    await supabase.from('customers').delete().eq('id', id)
    setSel(null); reload()
  }

  const selCustomer = customers.find(c => c.id === sel)
  const cTx = sel ? transactions.filter(t => t.customer_id === sel) : []
  const cUnits = cTx.reduce((s,t)=>s+t.items.reduce((ss,i)=>ss+(+i.qty||0),0),0)
  const cCost = cTx.reduce((s,t)=>s+t.cost,0)
  const cRev = cTx.reduce((s,t)=>s+t.total_revenue,0)
  const cProfit = cTx.reduce((s,t)=>s+t.profit,0)
  const cUnpaid = cTx.filter(t=>!t.paid).reduce((s,t)=>s+t.total_revenue,0)
  const fruitMap = {}
  cTx.forEach(t => t.items.forEach(it => {
    if (!fruitMap[it.fruitId]) fruitMap[it.fruitId] = { qty:0, cost:0 }
    const f = fruits.find(f => f.id === it.fruitId)
    if (f) { fruitMap[it.fruitId].qty += +it.qty; fruitMap[it.fruitId].cost += f.cost * it.qty }
  }))

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <input placeholder="客户姓名" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp} />
        <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp}>
          <option>C端</option><option>B端</option>
        </select>
        <button onClick={add} style={btnStyle('#2d6a2d')}>添加客户</button>
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:'0 0 240px' }}>
          {customers.map(c => (
            <div key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)} style={{
              padding:'10px 14px', borderRadius:8, marginBottom:6, cursor:'pointer',
              background:sel===c.id?'#2d6a2d':'#f1f8f1', color:sel===c.id?'#fff':'#222',
              border:'1px solid #a5d6a7', display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div><strong>{c.name}</strong><div style={{fontSize:12,opacity:0.8}}>{c.type}</div></div>
              <button onClick={e=>{e.stopPropagation();del(c.id)}} style={{background:'none',border:'none',color:sel===c.id?'#fff':'#c00',cursor:'pointer',fontSize:16}}>×</button>
            </div>
          ))}
        </div>
        {selCustomer && (
          <div style={{ flex:1, minWidth:260 }}>
            <h3 style={{marginTop:0}}>{selCustomer.name} <span style={{fontSize:13,color:'#888',fontWeight:400}}>（{selCustomer.type}）</span></h3>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
              {[['交易次数',cTx.length],['销售数量',cUnits],['成本',Math.round(cCost)+'元'],['收入',Math.round(cRev)+'元'],['利润',Math.round(cProfit)+'元'],['未收款',Math.round(cUnpaid)+'元']].map(([l,v],i)=>(
                <div key={l} style={{background:'#f1f8f1',border:'1px solid #a5d6a7',borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#666'}}>{l}</div>
                  <div style={{fontWeight:700,color:i===4?(cProfit>=0?'#2d6a2d':'#c00'):i===5?'#e65100':'#222'}}>{v}</div>
                </div>
              ))}
            </div>
            <h4>按水果分类</h4>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead><tr style={{background:'#e8f5e9'}}>
                {['水果','数量','成本'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(fruitMap).map(([fid,d])=>{
                  const f=fruits.find(f=>f.id===fid)
                  return <tr key={fid} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'6px 10px'}}>{f?.name??'？'}</td>
                    <td style={{padding:'6px 10px'}}>{d.qty}</td>
                    <td style={{padding:'6px 10px'}}>{Math.round(d.cost)}元</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}