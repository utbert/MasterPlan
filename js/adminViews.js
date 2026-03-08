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
    const summaryEl = document.getElementById('time-admin-summary');
    const monthFilterEl = document.getElementById('time-month-filter');
    if(!el || !summaryEl) return;

    const monthFilter = monthFilterEl ? monthFilterEl.value : 'all';
    const rows = Object.entries(state.workHours).map(([key, rec]) => {
        const [year,mId,dayIdx] = key.split('-');
        const yyyy = parseInt(year);
        const day = new Date(yyyy,0,1); day.setDate(day.getDate()+parseInt(dayIdx));
        if(yyyy !== currentYear) return null;
        if(monthFilter !== 'all' && (day.getMonth()+1) !== parseInt(monthFilter,10)) return null;

        const m = getMonteur(mId);
        const from = rec.from || '--:--';
        const to = rec.to || '--:--';
        const pause = rec.breakMin || 0;
        const hours = rec.hours || 0;
        const note = rec.note || '';
        const overtime = Math.round((hours - 8) * 100) / 100;
        return { year:yyyy, name:m?m.name:mId, dateObj:day, date:day.toLocaleDateString('de-DE'), from, to, pause, hours, overtime, note };
    }).filter(Boolean).sort((a,b)=> a.dateObj - b.dateObj || a.name.localeCompare(b.name));

    const totalsByEmployee = {};
    rows.forEach(r => {
        if(!totalsByEmployee[r.name]) totalsByEmployee[r.name] = { days:0, hours:0, overtime:0 };
        totalsByEmployee[r.name].days += 1;
        totalsByEmployee[r.name].hours += r.hours;
        totalsByEmployee[r.name].overtime += r.overtime;
    });

    const totalHours = rows.reduce((a,b)=>a+b.hours,0);
    const totalOvertime = rows.reduce((a,b)=>a+b.overtime,0);
    const avgHours = rows.length ? Math.round((totalHours/rows.length)*100)/100 : 0;

    summaryEl.innerHTML = `
      <div class="kpi-row">
        <div class="kpi"><strong>Einträge:</strong> ${rows.length}</div>
        <div class="kpi"><strong>Gesamtstunden:</strong> ${Math.round(totalHours*100)/100}h</div>
        <div class="kpi"><strong>Ø pro Tag:</strong> ${avgHours}h</div>
        <div class="kpi"><strong>Überstunden gesamt:</strong> ${Math.round(totalOvertime*100)/100}h</div>
      </div>
      <table class="admin-table"><thead><tr><th>Mitarbeiter</th><th>Tage</th><th>Stunden</th><th>Überstunden</th></tr></thead><tbody>
      ${Object.entries(totalsByEmployee).map(([name,t])=>`<tr><td>${name}</td><td>${t.days}</td><td>${Math.round(t.hours*100)/100}h</td><td>${Math.round(t.overtime*100)/100}h</td></tr>`).join('')}
      </tbody></table>
    `;

    el.innerHTML = `<table class="admin-table"><thead><tr><th>Mitarbeiter</th><th>Datum</th><th>Von</th><th>Bis</th><th>Pause</th><th>Ist</th><th>Überstunden</th><th>Notiz</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.date}</td><td>${r.from}</td><td>${r.to}</td><td>${r.pause}m</td><td>${r.hours}h</td><td>${r.overtime}h</td><td>${r.note}</td></tr>`).join('')}</tbody></table>`;
}

function exportTimeCsv() {
    const monthFilterEl = document.getElementById('time-month-filter');
    const monthFilter = monthFilterEl ? monthFilterEl.value : 'all';
    const rows = Object.entries(state.workHours).map(([key, rec]) => {
        const [year,mId,dayIdx] = key.split('-');
        const yyyy = parseInt(year);
        const day = new Date(yyyy,0,1); day.setDate(day.getDate()+parseInt(dayIdx));
        if(yyyy !== currentYear) return null;
        if(monthFilter !== 'all' && (day.getMonth()+1) !== parseInt(monthFilter,10)) return null;
        const m = getMonteur(mId);
        return {
            mitarbeiter: m ? m.name : mId,
            datum: day.toLocaleDateString('de-DE'),
            von: rec.from || '',
            bis: rec.to || '',
            pauseMin: rec.breakMin || 0,
            stunden: rec.hours || 0,
            notiz: (rec.note || '').replace(/"/g, '""')
        };
    }).filter(Boolean);

    const header = ['Mitarbeiter','Datum','Von','Bis','PauseMin','Stunden','Notiz'];
    const lines = [header.join(';')].concat(rows.map(r => `${r.mitarbeiter};${r.datum};${r.von};${r.bis};${r.pauseMin};${r.stunden};"${r.notiz}"`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeiterfassung-${currentYear}-${monthFilter==='all'?'all':monthFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
