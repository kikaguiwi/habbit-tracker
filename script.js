let habits = [];
let darkMode = false;

// ======== Инициализация ========
if (localStorage.getItem('habits')) {
  habits = JSON.parse(localStorage.getItem('habits'));
  renderHabits();
}
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  darkMode = true;
  document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
}

// ======== Назначение кнопок ========
document.getElementById('add-btn').addEventListener('click', addHabit);
document.getElementById('ai-btn').addEventListener('click', askAI);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// ======== Привычки ========
function addHabit() {
  const name = document.getElementById('habit-name').value.trim();
  if (!name) return;
  habits.push({ name, done: [], streak: 0 });
  saveHabits();
  renderHabits();
  document.getElementById('habit-name').value = '';
}

function saveHabits() {
  localStorage.setItem('habits', JSON.stringify(habits));
}

function renderHabits() {
  const list = document.getElementById('habit-list');
  list.innerHTML = '';

  habits.forEach((habit, index) => {
    const doneToday = habit.done.includes(new Date().toDateString());

    const card = document.createElement('div');
    card.className = 'habit-card';

    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <div class="habit-name">${habit.name}</div>
      <div class="habit-streak">🔥 Серия: ${habit.streak} дн.</div>
    `;

    const btnDiv = document.createElement('div');

    const markBtn = document.createElement('button');
    markBtn.innerText = doneToday ? '✅' : 'Отметить';
    markBtn.addEventListener('click', () => markDone(index));

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = '🗑 Удалить';
    deleteBtn.style.background = '#ff5c5c';
    deleteBtn.addEventListener('click', () => deleteHabit(index));

    btnDiv.appendChild(markBtn);
    btnDiv.appendChild(deleteBtn);

    card.appendChild(infoDiv);
    card.appendChild(btnDiv);
    list.appendChild(card);
  });

  renderProgress();
}

function markDone(index) {
  const today = new Date().toDateString();
  const habit = habits[index];
  if (!habit.done.includes(today)) {
    habit.done.push(today);
    habit.streak++;
  } else {
    habit.done = habit.done.filter(d => d !== today);
    habit.streak = Math.max(0, habit.streak - 1);
  }
  saveHabits();
  renderHabits();
}

function deleteHabit(index) {
  if (!confirm(`Удалить привычку "${habits[index].name}"?`)) return;
  habits.splice(index, 1);
  saveHabits();
  renderHabits();
}

// ======== Прогресс ========
function renderProgress() {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  const labels = habits.map(h => h.name);
  const data = habits.map(h => h.done.length);

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: darkMode ? '#6ea8fe' : '#4b8bfd',
        borderRadius: 6
      }]
    },
    options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
  });
}

// ======== Тема ========
function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', darkMode ? 'dark':'light');
  document.getElementById('theme-toggle').innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  renderProgress();
}

// ======== ИИ через OpenAI GPT-3.5 ========
async function askAI() {
  const input = document.getElementById("user-input").value.trim();
  const output = document.getElementById("ai-response");

  if (!input) { output.innerText = "Напиши, что мешает 💬"; return; }

  output.innerText = "ИИ думает... 🤔";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer YOUR_OPENAI_KEY`, // <- твой ключ
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: input }],
        max_tokens: 200
      })
    });

    const data = await res.json();
    output.innerText = data.choices[0].message.content;

  } catch(e) {
    console.error(e);
    output.innerText = "Ошибка сети или токена 😔";
  }
}
