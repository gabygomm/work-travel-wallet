import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from './supabase'
import { Wallet, LayoutDashboard, ChartNoAxesColumnIncreasing, Settings, Plus, ArrowLeft, Pencil, Trash2, ChevronDown, Sun, Moon, LogOut, FileDown, UserRound, CalendarDays, X, Check, Plane, Target, CircleDollarSign } from 'lucide-react'
import './App.css'

const categories = ['Alojamiento', 'Comida', 'Transporte', 'Compras', 'Salud', 'Entretenimiento', 'Otros']
const money = n => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(Number(n) || 0)
const today = () => new Date().toLocaleDateString('en-CA')
const dateLabel = d => d ? d.split('-').reverse().join('/') : '—'
const monthLabel = k => k ? new Intl.DateTimeFormat('es-ES', { month:'long', year:'numeric'}).format(new Date(Number(k.slice(0,4)), Number(k.slice(5,7))-1, 1)) : ''
// Selector libre: se puede consultar cualquier mes y año, sin depender
// de las fechas de inicio y fin del programa Work & Travel.
const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const availableYears = Array.from({length: 201}, (_,i)=>1900+i) // 1900 a 2100
function MonthYearPicker({ value, onChange }) {
  const year = value.slice(0,4)
  const monthNumber = value.slice(5,7)
  return <label className="month-picker">
    <CalendarDays size={18}/>
    <select aria-label="Seleccionar mes" value={monthNumber} onChange={e=>onChange(`${year}-${e.target.value}`)}>
      {monthNames.map((name,i)=><option key={name} value={String(i+1).padStart(2,'0')}>{name}</option>)}
    </select>
    <select aria-label="Seleccionar año" style={{flex:'0 0 96px'}} value={year} onChange={e=>onChange(`${e.target.value}-${monthNumber}`)}>
      {availableYears.map(y=><option key={y} value={String(y)}>{y}</option>)}
    </select>
  </label>
}
const sum = rows => rows.reduce((s,t)=>{s[t.type] += Number(t.amount); return s},{income:0,expense:0})
const safeMessage = e => e?.message || 'Ocurrió un error inesperado.'

export default function App() {
  const [session,setSession] = useState(null)
  const [starting,setStarting] = useState(true)
  useEffect(()=>{
    let alive=true
    supabase.auth.getSession().then(({data,error})=>{if(alive){if(error) console.error(error);setSession(data?.session||null);setStarting(false)}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{if(alive){setSession(s);setStarting(false)}})
    return ()=>{alive=false;subscription.unsubscribe()}
  },[])
  if(starting) return <div className="auth-center">Cargando Work & Travel Wallet…</div>
  return session?.user ? <WalletApp key={session.user.id} user={session.user}/> : <AuthScreen/>
}

function AuthScreen(){
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({name:'',email:'',password:'',city:'',start:'2027-06-01',end:'2027-08-31'})
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')
  const update=(key,value)=>setForm(f=>({...f,[key]:value}))
  const submit=async e=>{
    e.preventDefault();setNotice('');setBusy(true)
    try{
      if(mode==='signup'){
        if(form.end<form.start) throw new Error('La fecha de fin debe ser posterior al inicio.')
        const {data,error}=await supabase.auth.signUp({email:form.email.trim(),password:form.password,options:{data:{full_name:form.name.trim(),city:form.city.trim(),program_start:form.start,program_end:form.end},emailRedirectTo:window.location.origin+import.meta.env.BASE_URL}})
        if(error) throw error
        if(!data.session){setNotice('Cuenta creada. Revisa tu correo, confirma la dirección y después inicia sesión.');setMode('login')}
      }else if(mode==='reset'){
        const {error}=await supabase.auth.resetPasswordForEmail(form.email.trim(),{redirectTo:window.location.origin+import.meta.env.BASE_URL})
        if(error) throw error
        setNotice('Si el correo existe, recibirás instrucciones para recuperar la contraseña.')
      }else{
        const {error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password})
        if(error) throw error
      }
    }catch(e){setNotice(safeMessage(e))}finally{setBusy(false)}
  }
  return <div className="wt-app"><div className="phone auth-phone">
    <header className="topbar"><div className="logo-mark"><Plane size={22}/></div><div className="brand"><b>Work & Travel <span>Wallet</span></b><small>Tu dinero, bajo control</small></div></header>
    <main className="content"><div className="screen-heading"><h1>{mode==='signup'?'Crear perfil':mode==='reset'?'Recuperar contraseña':'Iniciar sesión'}</h1><p>{mode==='signup'?'Cada persona tiene su propia cuenta.':'Administra tus ingresos y gastos de Work & Travel.'}</p></div>
      <form className="white-card edit-form" onSubmit={submit}>
        {mode==='signup'&&<label>Nombre completo<input required value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Mateo"/></label>}
        <label>Correo electrónico<input required type="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="correo@ejemplo.com"/></label>
        {mode!=='reset'&&<label>Contraseña<input required type="password" minLength={8} autoComplete={mode==='signup'?'new-password':'current-password'} value={form.password} onChange={e=>update('password',e.target.value)} placeholder="Mínimo 8 caracteres"/></label>}
        {mode==='signup'&&<><label>Ciudad de trabajo<input value={form.city} onChange={e=>update('city',e.target.value)} placeholder="Ocean City, Maryland"/></label><label>Inicio del programa<input required type="date" value={form.start} onChange={e=>update('start',e.target.value)}/></label><label>Fin del programa<input required type="date" value={form.end} onChange={e=>update('end',e.target.value)}/></label></>}
        <button type="submit" className="yellow-btn" disabled={busy}>{busy?'Procesando…':mode==='signup'?'Crear perfil':mode==='reset'?'Enviar correo':'Iniciar sesión'}</button>
        {notice&&<p className="auth-message" role="status">{notice}</p>}
      </form>
      <button className="auth-link" onClick={()=>{setMode(mode==='signup'?'login':'signup');setNotice('')}}>{mode==='signup'?'Ya tengo cuenta':'Crear perfil'}</button>
      {mode!=='reset'&&<button className="auth-link" onClick={()=>{setMode('reset');setNotice('')}}>¿Olvidaste tu contraseña?</button>}
      {mode==='reset'&&<button className="auth-link" onClick={()=>{setMode('login');setNotice('')}}>Volver a iniciar sesión</button>}
    </main>
  </div></div>
}

function WalletApp({user}){
  const [page,setPage]=useState('inicio')
  const [dark,setDark]=useState(()=>localStorage.getItem('wtw:dark')==='1')
  const [profile,setProfile]=useState({name:user.user_metadata?.full_name||'Viajero',email:user.email||'',city:user.user_metadata?.city||'',start:user.user_metadata?.program_start||'2027-06-01',end:user.user_metadata?.program_end||'2027-08-31',currency:'USD',secondary_currency:''})
  const [profileForm,setProfileForm]=useState(null)
  const [transactions,setTransactions]=useState([])
  const [budgetRows,setBudgetRows]=useState([])
  const [goal,setGoal]=useState({goal_name:'Meta del viaje',target_amount:3000})
  const [goalForm,setGoalForm]=useState(null)
  const [scope,setScope]=useState('program')
  const [month,setMonth]=useState('2027-06')
  const initialMonthSet=useRef(false)
  const [budgetScope,setBudgetScope]=useState('program')
  const [budgetForm,setBudgetForm]=useState({})
  const [editing,setEditing]=useState(null)
  const [form,setForm]=useState({description:'',type:'expense',amount:'',category:'Comida',date:today(),repeat_monthly:false})
  const [notice,setNotice]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)

  const notify=e=>setNotice(safeMessage(e))
  const load=async()=>{
    const [p,t,b,g]=await Promise.all([
      supabase.from('profiles').select('full_name,city,program_start,program_end,currency,secondary_currency').eq('id',user.id).maybeSingle(),
      supabase.from('transactions').select('id,user_id,type,description,amount,category,transaction_date,repeat_monthly').eq('user_id',user.id).order('transaction_date',{ascending:false}).limit(1000),
      supabase.from('budgets').select('id,user_id,category,scope,period_month,amount').eq('user_id',user.id).limit(1000),
      supabase.from('savings_goals').select('goal_name,target_amount').eq('user_id',user.id).maybeSingle()
    ])
    const error=[p.error,t.error,b.error,g.error].find(Boolean)
    if(error) throw error
    if(p.data){const next={name:p.data.full_name||user.email?.split('@')[0]||'Viajero',email:user.email||'',city:p.data.city||'',start:p.data.program_start||'2027-06-01',end:p.data.program_end||'2027-08-31',currency:p.data.currency||'USD',secondary_currency:p.data.secondary_currency||''};setProfile(next);if(!initialMonthSet.current){setMonth(next.start.slice(0,7));initialMonthSet.current=true}}
    setTransactions((t.data||[]).map(x=>({id:x.id,type:x.type,title:x.description,amount:Number(x.amount),category:x.category,date:x.transaction_date,repeat_monthly:x.repeat_monthly})))
    setBudgetRows(b.data||[])
    if(g.data)setGoal({goal_name:g.data.goal_name,target_amount:Number(g.data.target_amount)})
  }
  useEffect(()=>{let alive=true;load().catch(e=>{if(alive)notify(e)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[user.id]) // cargar solo al iniciar sesión
  useEffect(()=>{localStorage.setItem('wtw:dark',dark?'1':'0')},[dark])

  const inside=t=>t.date>=profile.start && t.date<=profile.end
  const all=transactions.filter(inside)
  const visible=scope==='program'?all:transactions.filter(t=>t.date.slice(0,7)===month)
  const totals=sum(all),shown=sum(visible)
  const balance=totals.income-totals.expense
  const cats=useMemo(()=>categories.map(category=>({category,amount:visible.filter(t=>t.type==='expense'&&t.category===category).reduce((a,t)=>a+Number(t.amount),0)})).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount),[visible])
  const maxCat=Math.max(1,...cats.map(x=>x.amount))
  const periodMonth=scope==='monthly'?month+'-01':null
  const budgetAmount=(category,s=scope,m=month)=>Number(budgetRows.find(x=>x.category===category&&x.scope===s&&(s==='program'||x.period_month===m+'-01'))?.amount||0)
  const currentBudget=(s=budgetScope,m=month)=>Object.fromEntries(categories.map(c=>[c,budgetAmount(c,s,m)]))
  const openNew=()=>{setEditing('new');setForm({description:'',type:'expense',amount:'',category:'Comida',date:today(),repeat_monthly:false})}
  const openEdit=t=>{setEditing(t.id);setForm({description:t.title,type:t.type,amount:String(t.amount),category:t.category,date:t.date,repeat_monthly:!!t.repeat_monthly})}
  const saveMovement=async e=>{
    e.preventDefault();if(busy)return;setBusy(true)
    try{
      const amount=Number(form.amount)
      if(!Number.isFinite(amount)||amount<=0)throw new Error('Escribe un monto mayor que cero.')
      const data={user_id:user.id,type:form.type,description:form.description.trim(),amount,category:form.type==='income'?'Sueldo':form.category,transaction_date:form.date,repeat_monthly:false}
      if(!data.description)throw new Error('Escribe una descripción.')
      const req=editing==='new'?supabase.from('transactions').insert(data):supabase.from('transactions').update(data).eq('id',editing).eq('user_id',user.id)
      const {error}=await req
      if(error)throw error
      await load();setEditing(null);setNotice('Movimiento guardado correctamente.')
    }catch(e){notify(e)}finally{setBusy(false)}
  }
  const deleteMovement=async()=>{
    if(!window.confirm('¿Eliminar este movimiento definitivamente?'))return
    setBusy(true);try{const {error}=await supabase.from('transactions').delete().eq('id',editing).eq('user_id',user.id);if(error)throw error;await load();setEditing(null);setNotice('Movimiento eliminado.')}catch(e){notify(e)}finally{setBusy(false)}
  }
  const editBudgets=(s=scope)=>{setBudgetScope(s);setBudgetForm(currentBudget(s));setPage('presupuestos')}
  const saveBudgets=async()=>{
    if(busy)return;setBusy(true)
    try{
      for(const category of categories){
        const amount=Number(budgetForm[category]||0)
        if(!Number.isFinite(amount)||amount<0)throw new Error('Los presupuestos deben ser montos válidos.')
        const existing=budgetRows.find(x=>x.category===category&&x.scope===budgetScope&&(budgetScope==='program'||x.period_month===month+'-01'))
        const payload={user_id:user.id,category,scope:budgetScope,period_month:budgetScope==='monthly'?month+'-01':null,amount}
        const {error}=existing?await supabase.from('budgets').update(payload).eq('id',existing.id).eq('user_id',user.id):await supabase.from('budgets').insert(payload)
        if(error)throw error
      }
      await load();setPage('resumen');setNotice('Presupuestos guardados en tu cuenta.')
    }catch(e){notify(e)}finally{setBusy(false)}
  }
  const saveProfile=async e=>{
    e.preventDefault();if(profileForm.end<profileForm.start){setNotice('La fecha de fin debe ser posterior al inicio.');return}
    setBusy(true);try{
      const data={full_name:profileForm.name.trim(),city:profileForm.city.trim(),program_start:profileForm.start,program_end:profileForm.end,currency:'USD',secondary_currency:profileForm.secondary_currency||null}
      const {error}=await supabase.from('profiles').update(data).eq('id',user.id)
      if(error)throw error
      await load();setProfileForm(null);setPage('ajustes');setNotice('Perfil actualizado.')
    }catch(e){notify(e)}finally{setBusy(false)}
  }
  const saveGoal=async e=>{
    e.preventDefault();setBusy(true)
    try{
      const amount=Number(goalForm.target_amount)
      if(!Number.isFinite(amount)||amount<=0)throw new Error('La meta debe ser mayor que cero.')
      const {error}=await supabase.from('savings_goals').upsert({user_id:user.id,goal_name:goalForm.goal_name.trim()||'Meta del viaje',target_amount:amount},{onConflict:'user_id'})
      if(error)throw error
      await load();setGoalForm(null);setNotice('Meta de ahorro guardada.')
    }catch(e){notify(e)}finally{setBusy(false)}
  }
  const exportPdf=()=>{
    const start=window.prompt('Fecha inicial del reporte (AAAA-MM-DD)',profile.start)
    if(start===null)return
    const end=window.prompt('Fecha final del reporte (AAAA-MM-DD)',profile.end)
    if(end===null)return
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end){setNotice('Ingresa un rango de fechas válido.');return}
    const data=transactions.filter(t=>t.date>=start&&t.date<=end)
    const totals=sum(data)
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
    const w=window.open('','_blank','width=850,height=700')
    if(!w){setNotice('Permite las ventanas emergentes para generar el reporte PDF.');return}
    const rows=data.map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td>${t.type==='income'?'Ingreso':'Gasto'}</td><td>${money(t.amount)}</td></tr>`).join('')
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte Work & Travel Wallet</title><style>body{font:14px Arial,sans-serif;padding:30px;color:#122e49}h1{font-size:24px}table{border-collapse:collapse;width:100%;margin-top:25px}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left}th{background:#e9f2fb}button{padding:12px;background:#ffcc1d;border:0;cursor:pointer}@media print{button{display:none}}</style></head><body><h1>Work & Travel Wallet</h1><p>Reporte de ${esc(start)} a ${esc(end)}</p><p>Ingresos: <b>${money(totals.income)}</b> · Gastos: <b>${money(totals.expense)}</b> · Ahorro: <b>${money(totals.income-totals.expense)}</b></p><button onclick="window.print()">Guardar como PDF / Imprimir</button><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th>Monto</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
    w.document.close()
  }
  const percent=goal.target_amount>0?Math.min(100,Math.max(0,balance/goal.target_amount*100)):0
  if(loading)return <div className="auth-center">Cargando tus datos…</div>
  return <div className={`wt-app ${dark?'dark':''}`}><div className="phone">
    <header className="topbar"><div className="logo-mark"><Plane size={22}/></div><div className="brand"><b>Work & Travel <span>Wallet</span></b><small>Tu dinero, bajo control</small></div><button className="avatar" aria-label="Mi perfil" onClick={()=>{setProfileForm(profile);setPage('perfil')}}>{(profile.name||'V')[0].toUpperCase()}</button></header>
    <main className="content">
      {page==='inicio'&&<><div className="hello">¡Hola, {profile.name}! <span>✈️</span><p>Así va tu aventura en Estados Unidos.</p></div><section className="balance-card"><div className="eyebrow">SALDO DISPONIBLE DEL PROGRAMA</div><strong>{money(balance)}</strong><div className="period">Del {dateLabel(profile.start)} al {dateLabel(profile.end)}</div><div className="balance-bottom"><div><span>Ingresos netos</span><b>{money(totals.income)}</b></div><div><span>Gastos</span><b>{money(totals.expense)}</b></div></div></section>
        <section className="white-card goal-card"><div className="card-heading"><b><Target size={19}/> {goal.goal_name}</b><button className="link-btn" onClick={()=>setGoalForm({...goal})}>Editar meta</button></div><div className="goal-numbers"><strong>{money(Math.max(0,balance))}</strong><small>{percent.toFixed(0)}% de {money(goal.target_amount)}</small></div><div className="progress-track"><div style={{width:percent+'%'}}/></div></section>
        <div className="section-heading"><h2>Movimientos recientes</h2><button onClick={()=>setPage('movimientos')}>Ver todos</button></div><section className="white-card tx-list">{transactions.slice(0,5).length?transactions.slice(0,5).map(t=><Tx key={t.id} t={t} onClick={()=>openEdit(t)}/>):<p className="empty">Todavía no tienes movimientos registrados.</p>}</section><button className="yellow-btn" onClick={openNew}><Plus size={19}/> Nuevo movimiento</button></>}
      {page==='resumen'&&<><div className="screen-heading"><h1>Resumen financiero</h1><p>Consulta todo tu programa o un mes específico.</p></div><div className="segmented"><button className={scope==='program'?'active':''} onClick={()=>setScope('program')}>Todo el programa</button><button className={scope==='monthly'?'active':''} onClick={()=>setScope('monthly')}>Por mes</button></div>
        {scope==='monthly'&&<MonthYearPicker value={month} onChange={setMonth}/>}
        <section className="white-card overview"><div className="card-heading"><b>{scope==='program'?'Resumen de todo el programa':`Resumen de ${monthLabel(month)}`}</b></div><div className="summary-pair"><div><small>Ingresos</small><strong className="green">{money(shown.income)}</strong></div><div><small>Gastos</small><strong className="red">{money(shown.expense)}</strong></div></div><div className="summary-savings"><small>Ahorro neto</small><strong>{money(shown.income-shown.expense)}</strong></div></section>
        <section className="white-card"><div className="card-heading"><b>Gastos por categoría</b></div>{cats.length?cats.map((x,i)=><div className="cat-row" key={x.category}><div className="cat-meta"><span>{x.category}</span><b>{money(x.amount)}</b></div><div className="cat-bar"><span className={`cat-fill fill-${i%5}`} style={{width:x.amount/maxCat*100+'%'}}/></div></div>):<p className="empty">No hay gastos para el período seleccionado.</p>}</section>
        <section className="white-card"><div className="card-heading"><b>Presupuestos {scope==='program'?'del programa':'del mes'}</b></div>{categories.map(c=>{const amount=budgetAmount(c),spent=visible.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+t.amount,0);return <div className="budget-item" key={c}><div><span>{c}</span><small>{money(spent)} de {money(amount)}</small></div><div className="progress-track"><div className={amount>0&&spent>=amount?'over':''} style={{width:(amount?Math.min(100,spent/amount*100):0)+'%'}}/></div></div>})}<button className="outline-btn" onClick={()=>editBudgets(scope)}><Pencil size={16}/> Editar presupuesto</button></section></>}
      {page==='movimientos'&&<><div className="screen-heading"><h1>Movimientos</h1><p>Consulta, edita o elimina registros.</p></div><section className="white-card tx-list">{transactions.length?transactions.map(t=><Tx key={t.id} t={t} onClick={()=>openEdit(t)}/>):<p className="empty">No hay movimientos todavía.</p>}</section><button className="yellow-btn" onClick={openNew}><Plus size={18}/> Nuevo movimiento</button></>}
      {page==='presupuestos'&&<><button className="back" onClick={()=>setPage('resumen')}><ArrowLeft size={18}/> Volver</button><div className="screen-heading"><h1>Editar presupuesto</h1><p>Los cambios se guardarán en tu cuenta.</p></div><div className="segmented"><button className={budgetScope==='program'?'active':''} onClick={()=>{setBudgetScope('program');setBudgetForm(currentBudget('program'))}}>Todo el programa</button><button className={budgetScope==='monthly'?'active':''} onClick={()=>{setBudgetScope('monthly');setBudgetForm(currentBudget('monthly'))}}>Por mes</button></div>{budgetScope==='monthly'&&<MonthYearPicker value={month} onChange={newMonth=>{setMonth(newMonth);setBudgetForm(currentBudget('monthly',newMonth))}}/>}<section className="white-card budget-editor">{categories.map(c=><label key={c}><span>{c}</span><div><b>$</b><input type="number" min="0" step="0.01" value={budgetForm[c]??0} onChange={e=>setBudgetForm(b=>({...b,[c]:e.target.value}))}/></div></label>)}<div className="budget-total">Total presupuestado: {money(Object.values(budgetForm).reduce((a,b)=>a+Number(b||0),0))}</div></section><button className="yellow-btn" disabled={busy} onClick={saveBudgets}><Check size={17}/> {busy?'Guardando…':'Guardar presupuesto'}</button></>}
      {page==='ajustes'&&<><div className="screen-heading"><h1>Ajustes</h1><p>Personaliza tu experiencia.</p></div><section className="white-card"><div className="setting-group-title">PERFIL</div><button className="setting-row" onClick={()=>{setProfileForm({...profile});setPage('perfil')}}><span className="setting-icon"><UserRound size={21}/></span><span><b>Mi perfil</b><small>{profile.email}</small></span><span className="arrow">›</span></button></section><section className="white-card"><div className="setting-group-title">PREFERENCIAS</div><div className="setting-row"><span className="setting-icon"><CircleDollarSign size={21}/></span><span><b>Moneda principal</b><small>USD · Dólar estadounidense</small></span></div><div className="setting-row"><span className="setting-icon">{dark?<Moon size={21}/>:<Sun size={21}/>}</span><span><b>Modo oscuro</b><small>{dark?'Activado':'Desactivado'}</small></span><button className={`toggle ${dark?'on':''}`} type="button" aria-label="Modo oscuro" role="switch" aria-checked={dark} onClick={()=>setDark(v=>!v)}><span/></button></div></section><section className="white-card"><div className="setting-group-title">REPORTES</div><button className="setting-row" onClick={exportPdf}><span className="setting-icon"><FileDown size={21}/></span><span><b>Exportar PDF</b><small>Elige fechas y guarda como PDF</small></span><span className="arrow">›</span></button></section><button className="logout" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error)notify(error)}}><LogOut size={17}/> Cerrar sesión</button></>}
      {page==='perfil'&&profileForm&&<><button className="back" onClick={()=>setPage('ajustes')}><ArrowLeft size={17}/> Volver a Ajustes</button><div className="screen-heading"><h1>Mi perfil</h1></div><form className="white-card edit-form" onSubmit={saveProfile}><div className="big-avatar">{(profileForm.name||'V')[0].toUpperCase()}</div><label>Nombre completo<input required value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})}/></label><label>Correo electrónico<input disabled type="email" value={profileForm.email}/></label><label>Ciudad de trabajo<input value={profileForm.city} onChange={e=>setProfileForm({...profileForm,city:e.target.value})}/></label><label>Inicio del programa<input required type="date" value={profileForm.start} onChange={e=>setProfileForm({...profileForm,start:e.target.value})}/></label><label>Fin del programa<input required type="date" value={profileForm.end} onChange={e=>setProfileForm({...profileForm,end:e.target.value})}/></label><button disabled={busy} className="yellow-btn" type="submit">Guardar cambios</button></form></>}
    </main>
    <nav className="bottom-nav"><button className={page==='inicio'?'active':''} onClick={()=>setPage('inicio')}><Wallet size={21}/><span>Inicio</span></button><button className={page==='resumen'||page==='presupuestos'?'active':''} onClick={()=>setPage('resumen')}><ChartNoAxesColumnIncreasing size={21}/><span>Resumen</span></button><button className={page==='movimientos'?'active':''} onClick={()=>setPage('movimientos')}><LayoutDashboard size={21}/><span>Movimientos</span></button><button className={page==='ajustes'||page==='perfil'?'active':''} onClick={()=>setPage('ajustes')}><Settings size={21}/><span>Ajustes</span></button></nav>
  </div>
  {editing!==null&&<div className="modal-backdrop" onClick={()=>!busy&&setEditing(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{editing==='new'?'Nuevo movimiento':'Editar movimiento'}</h2><button aria-label="Cerrar" onClick={()=>setEditing(null)}><X size={21}/></button></div><form className="edit-form" onSubmit={saveMovement}><div className="segmented"><button type="button" className={form.type==='expense'?'active':''} onClick={()=>setForm(f=>({...f,type:'expense',category:'Comida'}))}>Gasto</button><button type="button" className={form.type==='income'?'active':''} onClick={()=>setForm(f=>({...f,type:'income',category:'Sueldo'}))}>Ingreso</button></div><label>Descripción<input required value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></label><label>Monto (USD)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></label><label>Fecha<input required type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></label>{form.type==='expense'&&<label>Categoría<select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>}<button className="yellow-btn" type="submit" disabled={busy}>{busy?'Guardando…':'Guardar movimiento'}</button>{editing!=='new'&&<button type="button" className="delete-btn" disabled={busy} onClick={deleteMovement}><Trash2 size={16}/> Eliminar movimiento</button>}</form></div></div>}
  {goalForm&&<div className="modal-backdrop" onClick={()=>setGoalForm(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>Editar meta de ahorro</h2><button onClick={()=>setGoalForm(null)}><X size={20}/></button></div><form className="edit-form" onSubmit={saveGoal}><label>Nombre<input required value={goalForm.goal_name} onChange={e=>setGoalForm(f=>({...f,goal_name:e.target.value}))}/></label><label>Monto objetivo (USD)<input required type="number" step="0.01" min="0.01" value={goalForm.target_amount} onChange={e=>setGoalForm(f=>({...f,target_amount:e.target.value}))}/></label><button type="submit" className="yellow-btn" disabled={busy}>Guardar meta</button></form></div></div>}
  {notice&&<div className="toast" role="status">{notice}<button aria-label="Cerrar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
  </div>
}

function Tx({t,onClick}) {return <button className="tx" onClick={onClick}><span className={`tx-icon ${t.type}`}>{t.type==='income'?'↗':'↘'}</span><span className="tx-detail"><b>{t.title}</b><small>{t.category} · {dateLabel(t.date)}</small></span><b className={t.type==='income'?'green':'red'}>{t.type==='income'?'+':'−'}{money(t.amount)}</b><Pencil size={13}/></button>}
