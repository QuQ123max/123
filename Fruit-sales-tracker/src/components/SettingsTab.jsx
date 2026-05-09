import { supabase } from '../supabase'
import { btnStyle } from '../App'

const INIT_FRUITS = [
  { id: 'f1', name: '苹果', cost: 0.5 },
  { id: 'f2', name: '香蕉', cost: 0.2 },
  { id: 'f3', name: '橙子', cost: 0.6 },
]
const INIT_CUSTOMERS = [
  { id: 'c1', name: '张三', type: 'C端' },
  { id: 'c2', name: '城市超市', type: 'B端' },
]

export default function SettingsTab({ reload }) {
  async function clearTransactions() {
    if (!confirm('确定清除所有交易记录？此操作不可撤销！')) return
    await supabase.from('transactions').delete().neq('id','__none__'); reload()
  }
  async function resetFruits() {
    if (!confirm('确定重置水果数据？')) return
    await supabase.from('fruits').delete().neq('id','__none__')
    await supabase.from('fruits').insert(INIT_FRUITS); reload()
  }
  async function resetCustomers() {
    if (!confirm('确定重置客户数据？')) return
    await supabase.from('customers').delete().neq('id','__none__')
    await supabase.from('customers').insert(INIT_CUSTOMERS); reload()
  }

  return (
    <div>
      <h3>危险操作</h3>
      <p style={{color:'#666',fontSize:14}}>以下操作影响所有用户的共享数据，不可撤销，请谨慎操作。</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button onClick={clearTransactions} style={btnStyle('#c00')}>清除所有交易记录</button>
        <button onClick={resetFruits} style={btnStyle('#e65100')}>重置水果数据</button>
        <button onClick={resetCustomers} style={btnStyle('#e65100')}>重置客户数据</button>
      </div>
    </div>
  )
}