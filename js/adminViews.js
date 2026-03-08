function switchView(view) {
    const ids = ['dispo','people','tasks','time'];
    ids.forEach(v => {
        document.getElementById(`view-${v}`).classList.toggle('active', v===view);
        const btn = document.querySelector(`.view-btn[data-view="${v}"]`);
        if(btn) btn.classList.toggle('active', v===view);
    });
    if(view === 'people') renderPeopleAdmin();
    if(view === 'tasks') renderTasksAdmin();
    if(view === 'time') renderTimeAdmin();
}

function renderPeopleAdmin() {
    const peopleEl = document.getElementById('people-admin-list');
    const resourceEl = document.getElementById('resource-admin-list');
    if(!peopleEl || !resourceEl) return;

    peopleEl.innerHTML = state.groups.map(g => `
        <div style="margin-bottom:10px; border:1px solid #eee; border-radius:6px; padding:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${g.name}</strong>
                <span>
                    <button class="btn" onclick="openEditModal('group', state.groups.find(x=>x.id==='${g.id}'))">Bearbeiten</button>
                    <button class="btn btn-primary" onclick="addMonteur(event,'${g.id}')">+ Mitarbeiter</button>
                </span>
            </div>
            <ul style="margin:8px 0 0 16px;">${g.monteure.map(m=>`<li>${m.name} <button class='btn' onclick="openEditModal('monteur', state.groups.find(x=>x.id==='${g.id}').monteure.find(y=>y.id==='${m.id}'),'${g.id}')">Bearbeiten</button></li>`).join('')}</ul>
        </div>
    `).join('');

    resourceEl.innerHTML = state.resourceGroups.map(rg => {
        const res = state.resources.filter(r => r.groupId===rg.id);
        return `
        <div style="margin-bottom:10px; border:1px solid #eee; border-radius:6px; padding:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${rg.name}</strong>
                <span>
                    <button class="btn" onclick="openEditModal('resourceGroup', state.resourceGroups.find(x=>x.id==='${rg.id}'))">Bearbeiten</button>
                    <button class="btn btn-warning" onclick="addResource(event,'${rg.id}')">+ Gerät</button>
                </span>
            </div>
            <ul style="margin:8px 0 0 16px;">${res.map(r=>`<li>${r.name} <button class='btn' onclick="openEditModal('resource', state.resources.find(x=>x.id==='${r.id}'))">Bearbeiten</button></li>`).join('')}</ul>
        </div>`;
    }).join('');
    refreshStateJson();
}

function renderTasksAdmin() {
    const el = document.getElementById('tasks-admin-list');
    const yearEl = document.getElementById('tasks-year-label');
    if(!el || !yearEl) return;
    yearEl.innerText = currentYear;
    const tasks = state.einsaetze.filter(e => e.year === currentYear).sort((a,b)=>a.start-b.start);
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Start</th><th>Dauer</th><th>Titel</th><th>Zugeordnet zu</th><th>Typ</th></tr></thead><tbody>${tasks.map(t=>{
        const m = getMonteur(t.mId);
        const r = getResource(t.mId);
        const owner = m ? m.name : (r ? r.name : '-');
        const typ = t.absenceType && t.absenceType !== 'none' ? `Abwesenheit: ${t.absenceType}` : 'Einsatz';
        return `<tr><td>${t.start+1}</td><td>${t.duration}</td><td>${t.title}</td><td>${owner}</td><td>${typ}</td></tr>`;
    }).join('')}</tbody></table>`;
}

function renderTimeAdmin() {
    const el = document.getElementById('time-admin-list');
    if(!el) return;
    const rows = Object.entries(state.workHours).map(([key, rec]) => {
        const [year,mId,dayIdx] = key.split('-');
        const m = getMonteur(mId);
        const day = new Date(parseInt(year),0,1); day.setDate(day.getDate()+parseInt(dayIdx));
        const from = rec.from || '--:--';
        const to = rec.to || '--:--';
        const pause = rec.breakMin || 0;
        const hours = rec.hours || 0;
        return { year:parseInt(year), name:m?m.name:mId, date:day.toLocaleDateString('de-DE'), from, to, pause, hours };
    }).sort((a,b)=> a.year!==b.year ? b.year-a.year : a.date.localeCompare(b.date));

    el.innerHTML = `<table class="admin-table"><thead><tr><th>Mitarbeiter</th><th>Datum</th><th>Von</th><th>Bis</th><th>Pause</th><th>Stunden</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.date}</td><td>${r.from}</td><td>${r.to}</td><td>${r.pause}m</td><td>${r.hours}h</td></tr>`).join('')}</tbody></table>`;
}

function refreshStateJson() {
    const ta = document.getElementById('state-json');
    if(ta) ta.value = JSON.stringify(state, null, 2);
}

function applyStateJson() {
    const ta = document.getElementById('state-json');
    if(!ta) return;
    try {
        const parsed = JSON.parse(ta.value);
        state = parsed;
        normalizeState();
        saveState();
        render();
        renderPeopleAdmin();
        renderTasksAdmin();
        renderTimeAdmin();
        alert('JSON erfolgreich übernommen.');
    } catch(err) {
        alert('Ungültiges JSON: ' + err.message);
    }
}
