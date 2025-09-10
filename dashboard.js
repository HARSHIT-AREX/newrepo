/* dashboard.js - final synced with theme toggle integrated
   - localStorage persistence
   - add / edit (popup) / delete / SMS (mock) / CSV export / Chart.js analytics
*/

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'ayursutra_elite_v1';
  const AUDIT_KEY = 'ayursutra_elite_audit';
  const session = JSON.parse(localStorage.getItem('ayursutra_session') || 'null');
  if(!session) { /* HTML guard redirects to login */ }
  document.getElementById('userName').innerText = session?.name || session?.username || session?.role || 'User';

  // theme toggle (dashboard)
  (function themeInit(){
    const btn = document.getElementById('theme-toggle');
    const apply = (t)=> {
      if(t === 'dark'){ document.body.classList.add('dark'); btn.textContent = '☀️'; }
      else { document.body.classList.remove('dark'); btn.textContent = '🌙'; }
    };
    const saved = localStorage.getItem('theme') || 'light';
    apply(saved);
    btn.addEventListener('click', ()=>{
      const now = document.body.classList.toggle('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', now);
      apply(now);
    });
  })();

  // load state
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
    patients: [], appointments: [], therapies: [], invoices: []
  }));
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  // utilities
  function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toast(msg){
    let t = document.getElementById('__toast__');
    if(!t){ t=document.createElement('div'); t.id='__toast__'; t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px'; t.style.padding='12px 16px'; t.style.background='#14371f'; t.style.color='#fff'; t.style.borderRadius='10px'; t.style.zIndex=99999; document.body.appendChild(t); }
    t.innerText = msg; t.style.opacity = '1';
    setTimeout(()=> t.style.opacity = '0', 1600);
  }
  function addAudit(obj){
    const arr = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    arr.unshift(Object.assign({ts: new Date().toISOString()}, obj));
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr));
    renderAudit();
  }
  function mockSendSms(to, text){
    toast(`Mock SMS sent to ${to}`);
    addAudit({to, text, type:'sms'});
  }

  // modal helpers
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');

  function openModal(title, fields, onSave){
    modalTitle.innerText = title;
    modalForm.innerHTML = '';
    fields.forEach(f=>{
      if(f.type === 'select'){
        const sel = document.createElement('select'); sel.name = f.name;
        f.options.forEach(o=>{ const opt = document.createElement('option'); opt.value=o.value; opt.text=o.label; if(String(f.value)===String(o.value)) opt.selected=true; sel.appendChild(opt); });
        if(f.required) sel.required=true;
        modalForm.appendChild(sel);
      } else {
        const inp = document.createElement('input');
        inp.type = f.type || 'text';
        inp.name = f.name;
        inp.placeholder = f.label || f.name;
        if(f.value != null) inp.value = f.value;
        if(f.accept) inp.accept = f.accept;
        if(f.required) inp.required = true;
        modalForm.appendChild(inp);
      }
    });
    modal.classList.remove('hidden');

    function saveHandler(){
      const fd = new FormData(modalForm);
      const values = {};
      for(const [k,v] of fd.entries()) values[k]=v;
      onSave(values);
      closeModal();
    }
    function closeModal(){
      modal.classList.add('hidden');
      modalSave.removeEventListener('click', saveHandler);
      modalCancel.removeEventListener('click', closeModal);
      modalForm.innerHTML = '';
    }
    modalSave.addEventListener('click', saveHandler);
    modalCancel.addEventListener('click', closeModal);
  }

  // file helper
  function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload = ()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

  /* ---------- PATIENTS ---------- */
  const formPatient = document.getElementById('formPatient');
  const tblPatients = document.getElementById('tblPatients');
  const exportPatientsBtn = document.getElementById('exportPatients');

  formPatient.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    const age = f.age.value.trim();
    const contact = f.contact.value.trim();
    const file = f.file.files[0];
    let files = [];
    if(file){ const data = await fileToBase64(file); files.push({name:file.name,type:file.type,data}); }
    state.patients.push({id:Date.now(), name, age, contact, files});
    saveState(); f.reset(); renderPatients(); toast('Patient added');
  });

  function renderPatients(){
    const apptSel = document.getElementById('apptPatientSelect');
    const therSel = document.getElementById('therPatientSelect');
    const billSel = document.getElementById('billPatientSelect');
    apptSel.innerHTML = therSel.innerHTML = billSel.innerHTML = '<option value="">--select--</option>';
    tblPatients.innerHTML = '';
    state.patients.forEach((p,i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.age)}</td>
        <td>${escapeHtml(p.contact||'')}</td>
        <td>${(p.files||[]).map(f=>`<a href="${f.data}" download="${f.name}">${f.name}</a>`).join('<br>')}</td>
        <td>
          <button class="btn-small" data-action="editPatient" data-i="${i}">Edit</button>
          <button class="btn-small" data-action="deletePatient" data-i="${i}">Delete</button>
          <button class="btn-small" data-action="smsPatient" data-i="${i}">SMS</button>
        </td>`;
      tblPatients.appendChild(tr);
      apptSel.insertAdjacentHTML('beforeend', `<option value="${i}">${escapeHtml(p.name)}</option>`);
      therSel.insertAdjacentHTML('beforeend', `<option value="${i}">${escapeHtml(p.name)}</option>`);
      billSel.insertAdjacentHTML('beforeend', `<option value="${i}">${escapeHtml(p.name)}</option>`);
    });
    document.getElementById('countPatients').innerText = state.patients.length;
    updateOverviewChart();
    renderAudit();
  }

  tblPatients.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action; const i = Number(btn.dataset.i);
    if(action === 'editPatient') openEditPatient(i);
    if(action === 'deletePatient') { if(confirm('Delete patient?')){ state.patients.splice(i,1); saveState(); renderPatients(); toast('Patient deleted'); } }
    if(action === 'smsPatient') { const p = state.patients[i]; mockSendSms(p.contact || '(no contact)', `Hello ${p.name}, AyurSutra reminder.`); }
  });

  function openEditPatient(i){
    const p = state.patients[i];
    openModal('Edit Patient', [
      {name:'name', label:'Full name', value:p.name, required:true},
      {name:'age', label:'Age', value:p.age},
      {name:'contact', label:'Contact', value:p.contact}
    ], (vals)=>{
      state.patients[i].name = vals.name; state.patients[i].age = vals.age; state.patients[i].contact = vals.contact;
      saveState(); renderPatients(); toast('Patient updated');
    });
  }

  exportPatientsBtn.addEventListener('click', ()=>exportCSV('patients'));

  /* ---------- APPOINTMENTS ---------- */
  const formAppt = document.getElementById('formAppt');
  const tblAppts = document.getElementById('tblAppts');
  const exportApptsBtn = document.getElementById('exportAppts');

  formAppt.addEventListener('submit', (e)=>{
    e.preventDefault();
    const f = e.target;
    const patientIdx = Number(f.patientIdx.value);
    const date = f.date.value;
    const time = f.time.value;
    const doctor = f.doctor.value.trim();
    if(isNaN(patientIdx) || !date || !time) return alert('Select patient + date + time');
    state.appointments.push({id:Date.now(), patient:patientIdx, date, time, doctor});
    saveState(); f.reset(); renderAppts(); toast('Appointment booked');
  });

  function renderAppts(){
    tblAppts.innerHTML = '';
    state.appointments.forEach((a,i) => {
      const p = state.patients[a.patient] || {};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(p.name||'')}</td><td>${escapeHtml(a.date)}</td><td>${escapeHtml(a.time)}</td><td>${escapeHtml(a.doctor||'')}</td>
        <td>
          <button class="btn-small" data-action="editAppt" data-i="${i}">Edit</button>
          <button class="btn-small" data-action="deleteAppt" data-i="${i}">Delete</button>
          <button class="btn-small" data-action="smsAppt" data-i="${i}">SMS</button>
        </td>`;
      tblAppts.appendChild(tr);
    });
    document.getElementById('countAppointments').innerText = state.appointments.length;
    updateOverviewChart();
  }

  tblAppts.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action; const i = Number(btn.dataset.i);
    if(action === 'editAppt') openEditAppt(i);
    if(action === 'deleteAppt') { if(confirm('Delete appointment?')){ state.appointments.splice(i,1); saveState(); renderAppts(); toast('Appointment deleted'); } }
    if(action === 'smsAppt'){ const a = state.appointments[i]; const p = state.patients[a.patient] || {}; mockSendSms(p.contact || '(no contact)', `Reminder: ${p.name || 'Patient'} on ${a.date} at ${a.time}`); }
  });

  function openEditAppt(i){
    const a = state.appointments[i];
    openModal('Edit Appointment', [
      {name:'patientIdx', type:'select', options: state.patients.map((p,idx)=>({value:idx,label:p.name})), value:a.patient, required:true},
      {name:'date', type:'date', value:a.date, required:true},
      {name:'time', type:'time', value:a.time, required:true},
      {name:'doctor', label:'Doctor', value:a.doctor || ''}
    ], (vals)=>{
      state.appointments[i].patient = Number(vals.patientIdx);
      state.appointments[i].date = vals.date;
      state.appointments[i].time = vals.time;
      state.appointments[i].doctor = vals.doctor;
      saveState(); renderAppts(); toast('Appointment updated');
    });
  }

  exportApptsBtn.addEventListener('click', ()=>exportCSV('appointments'));

  /* ---------- THERAPIES ---------- */
  const formTher = document.getElementById('formTher');
  const tblTher = document.getElementById('tblTher');
  const exportTherBtn = document.getElementById('exportTher');

  formTher.addEventListener('submit', (e)=>{
    e.preventDefault();
    const f = e.target;
    const patientIdx = Number(f.patientIdx.value);
    const therapy = f.therapy.value.trim();
    const sessions = Number(f.sessions.value) || 1;
    if(isNaN(patientIdx) || !therapy) return alert('Select patient and therapy');
    state.therapies.push({id:Date.now(), patient:patientIdx, therapy, sessions});
    saveState(); f.reset(); renderTher(); toast('Therapy assigned');
  });

  function renderTher(){
    tblTher.innerHTML = '';
    state.therapies.forEach((t,i)=>{
      const p = state.patients[t.patient] || {};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(p.name||'')}</td><td>${escapeHtml(t.therapy)}</td><td>${escapeHtml(String(t.sessions))}</td>
        <td>
          <button class="btn-small" data-action="editTher" data-i="${i}">Edit</button>
          <button class="btn-small" data-action="deleteTher" data-i="${i}">Delete</button>
          <button class="btn-small" data-action="smsTher" data-i="${i}">SMS</button>
        </td>`;
      tblTher.appendChild(tr);
    });
    document.getElementById('countTherapies').innerText = state.therapies.length;
    updateOverviewChart();
  }

  tblTher.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action; const i = Number(btn.dataset.i);
    if(action === 'editTher') openEditTher(i);
    if(action === 'deleteTher') { if(confirm('Delete therapy?')){ state.therapies.splice(i,1); saveState(); renderTher(); toast('Therapy deleted'); } }
    if(action === 'smsTher'){ const t = state.therapies[i]; const p = state.patients[t.patient] || {}; mockSendSms(p.contact || '(no contact)', `Therapy: ${t.therapy} assigned.`); }
  });

  function openEditTher(i){
    const t = state.therapies[i];
    openModal('Edit Therapy', [
      {name:'patientIdx', type:'select', options: state.patients.map((p,idx)=>({value:idx,label:p.name})), value:t.patient, required:true},
      {name:'therapy', label:'Therapy', value:t.therapy, required:true},
      {name:'sessions', label:'Sessions', value:t.sessions}
    ], (vals)=>{
      state.therapies[i].patient = Number(vals.patientIdx);
      state.therapies[i].therapy = vals.therapy;
      state.therapies[i].sessions = Number(vals.sessions) || 1;
      saveState(); renderTher(); toast('Therapy updated');
    });
  }

  exportTherBtn.addEventListener('click', ()=>exportCSV('therapies'));

  /* ---------- BILLING / INVOICES ---------- */
  const formBill = document.getElementById('formBill');
  const tblBills = document.getElementById('tblBills');
  const exportInvBtn = document.getElementById('exportInv');

  formBill.addEventListener('submit', (e)=>{
    e.preventDefault();
    const f = e.target;
    const patientIdx = Number(f.patientIdx.value);
    const amount = Number(f.amount.value);
    const desc = f.desc.value.trim();
    if(isNaN(patientIdx) || !amount) return alert('Select patient & enter amount');
    state.invoices.push({id:Date.now(), patient:patientIdx, amount, desc});
    saveState(); f.reset(); renderBills(); toast('Invoice created');
  });

  function renderBills(){
    tblBills.innerHTML = '';
    let total = 0;
    state.invoices.forEach((inv,i)=>{
      const p = state.patients[inv.patient] || {};
      total += Number(inv.amount||0);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(p.name||'')}</td><td>₹${Number(inv.amount).toFixed(2)}</td><td>${escapeHtml(inv.desc||'')}</td>
        <td>
          <button class="btn-small" data-action="viewInv" data-i="${i}">View</button>
          <button class="btn-small" data-action="smsInv" data-i="${i}">SMS</button>
          <button class="btn-small" data-action="deleteInv" data-i="${i}">Delete</button>
        </td>`;
      tblBills.appendChild(tr);
    });
    document.getElementById('countRevenue').innerText = `₹${total.toFixed(2)}`;
    updateOverviewChart();
  }

  tblBills.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action; const i = Number(btn.dataset.i);
    if(action === 'viewInv'){ const inv = state.invoices[i]; const p = state.patients[inv.patient]||{}; const w = window.open('','_blank'); w.document.write(`<h2>Invoice</h2><p>Patient: ${p.name||''}</p><p>Amount: ₹${inv.amount}</p><p>${inv.desc||''}</p>`); w.print(); }
    if(action === 'deleteInv'){ if(confirm('Delete invoice?')){ state.invoices.splice(i,1); saveState(); renderBills(); toast('Invoice deleted'); } }
    if(action === 'smsInv'){ const inv = state.invoices[i]; const p = state.patients[inv.patient]||{}; mockSendSms(p.contact||'(no contact)', `Invoice: ₹${inv.amount} for ${p.name||'Patient'}`); }
  });

  exportInvBtn.addEventListener('click', ()=>exportCSV('invoices'));

  /* ---------- Analytics & Audit ---------- */
  let overviewChart = null;
  function renderAnalytics(){
    const ctx = document.getElementById('chartOverview').getContext('2d');
    const labels = ['Patients','Appointments','Therapies','Revenue'];
    const data = [
      state.patients.length,
      state.appointments.length,
      state.therapies.length,
      state.invoices.reduce((s,i)=>s + (Number(i.amount)||0), 0)
    ];
    if(overviewChart) overviewChart.destroy();
    overviewChart = new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'Overview', data, backgroundColor:['#43a047','#2e7d32','#8e24aa','#cda34b'] }]}, options:{responsive:true, plugins:{legend:{display:false}}}});
    renderAudit();
  }
  function updateOverviewChart(){ if(document.getElementById('chartOverview')) renderAnalytics(); }

  function renderAudit(){
    const el = document.getElementById('auditLog');
    const log = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    el.innerHTML = log.map(l=>`<div><small>${new Date(l.ts).toLocaleString()}</small><div>${escapeHtml(l.to)} — ${escapeHtml(l.text)}</div><hr/></div>`).join('') || '<div class="muted">No audit entries</div>';
  }
  document.getElementById('clearAudit').addEventListener('click', ()=>{ localStorage.removeItem(AUDIT_KEY); renderAudit(); });

  /* ---------- CSV export ---------- */
  function exportCSV(kind){
    let rows = [];
    if(kind==='patients'){ rows = [['Name','Age','Contact']].concat(state.patients.map(p=>[p.name,p.age,p.contact||''])); }
    else if(kind==='appointments'){ rows = [['Patient','Date','Time','Doctor']].concat(state.appointments.map(a=>[(state.patients[a.patient]||{}).name||'', a.date, a.time, a.doctor||''])); }
    else if(kind==='therapies'){ rows = [['Patient','Therapy','Sessions']].concat(state.therapies.map(t=>[(state.patients[t.patient]||{}).name||'', t.therapy, t.sessions])); }
    else if(kind==='invoices'){ rows = [['Patient','Amount','Description']].concat(state.invoices.map(inv=>[(state.patients[inv.patient]||{}).name||'', inv.amount, inv.desc||''])); }
    else return;
    const csv = rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${kind}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  // initial render
  function init(){
    renderPatients(); renderAppts(); renderTher(); renderBills(); renderAnalytics(); renderAudit();

    // nav behavior
    document.querySelectorAll('.nav-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
        document.getElementById(btn.dataset.target).classList.add('active');
        if(btn.dataset.target === 'panelAnalytics') renderAnalytics();
      });
    });

    // logout
    document.getElementById('logoutBtn').addEventListener('click', ()=>{ if(confirm('Logout?')){ localStorage.removeItem('ayursutra_session'); location.href='login.html'; } });

    // export buttons on panels (also wired earlier)
    document.getElementById('exportPatients').addEventListener('click', ()=>exportCSV('patients'));
    document.getElementById('exportAppts').addEventListener('click', ()=>exportCSV('appointments'));
    document.getElementById('exportTher').addEventListener('click', ()=>exportCSV('therapies'));
    document.getElementById('exportInv').addEventListener('click', ()=>exportCSV('invoices'));
  }

  init();
});

