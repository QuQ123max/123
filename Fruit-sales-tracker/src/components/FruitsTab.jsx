import { useState } from 'react'
import { supabase } from '../supabase'
import { inp, btnStyle } from '../App'

function genId() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export default function FruitsTab({ fruits, reload }) {
  const [form, setForm] = useState({ name:'', cost:'' })

  async function add() {
    if (!form.name.trim() || !form.cost) return alert('请填写所有字段。')
    await supabase.from('fruits').insert({ id: genId(), name: form.name, cost: +form.cost })
    setForm({ name:'', cost:'' }); reload()
  }
  async function del(id) {
    if (!confirm('确定删除该水果？')) return
    await supabase.from('fruits').delete().eq('id', id); reload()
  }
  async function update(id, k, v) {
    await supabase.from('fruits').update({ [k]: k==='name'?v:+v }).eq('id', id); reload()
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <input placeholder="水果名称" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{...inp,width:140}} />
        <input type="number" placeholder="成本价（元）" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} style={{...inp,width:150}} />
        <button onClick={add} style={btnStyle('#2d6a2d')}>添加水果</button>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
        <thead><tr style={{background:'#e8f5e9'}}>
          {['水果','成本价（元）','操作'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:'2px solid #a5d6a7'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {fruits.map(f=>(
            <tr key={f.id} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:'8px 10px'}}><input defaultValue={f.name} onBlur={e=>update(f.id,'name',e.target.value)} style={{...inp,width:120}} /></td>
              <td style={{padding:'8px 10px'}}><input type="number" defaultValue={f.cost} onBlur={e=>update(f.id,'cost',e.target.value)} style={{...inp,width:100}} /></td>
              <td style={{padding:'8px 10px'}}><button onClick={()=>del(f.id)} style={btnStyle('#c00','small')}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}