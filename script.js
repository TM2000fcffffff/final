// localStorage는 막혀 있을 수 있으므로 안전하게 감싼다
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

/* ===== 다크 모드 ===== */
const themeBtn = document.getElementById("themeBtn");
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}
applyTheme(store.get("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  store.set("theme", next);
});

/* ===== 모바일 메뉴 ===== */
const sidebar = document.getElementById("sidebar");
document.getElementById("menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));
sidebar.addEventListener("click", (e) => {
  if (e.target.closest("a")) sidebar.classList.remove("open");
});

/* ===== 현재 보고 있는 섹션 표시 ===== */
const navLinks = document.querySelectorAll(".nav-link");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) =>
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id)
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
document.querySelectorAll(".day").forEach((sec) => observer.observe(sec));

/* ===== 학습 체크 & 진행률 ===== */
const checks = document.querySelectorAll("[data-check]");
const saved = JSON.parse(store.get("checks") || "{}");
function updateProgress() {
  const done = [...checks].filter((c) => c.checked).length;
  document.getElementById("progressText").textContent = `${done} / ${checks.length}`;
  document.getElementById("progressFill").style.width = (done / checks.length) * 100 + "%";
  checks.forEach((c) => {
    document.querySelector(`.nav-link[href="#${c.dataset.check}"]`)?.classList.toggle("done", c.checked);
  });
}
checks.forEach((c) => {
  c.checked = !!saved[c.dataset.check];
  c.addEventListener("change", () => {
    saved[c.dataset.check] = c.checked;
    store.set("checks", JSON.stringify(saved));
    updateProgress();
  });
});
updateProgress();

/* ===== 검색 ===== */
document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll(".day").forEach((sec) => {
    const items = sec.querySelectorAll(".searchable");
    let hits = 0;
    items.forEach((item) => {
      const match = !q || item.textContent.toLowerCase().includes(q);
      item.classList.toggle("hidden-by-search", !match);
      if (match) hits++;
    });
    const titleMatch = q && sec.querySelector(".day-head").textContent.toLowerCase().includes(q);
    if (titleMatch) items.forEach((item) => item.classList.remove("hidden-by-search"));
    sec.classList.toggle("hidden-by-search", !!q && hits === 0 && !titleMatch);
  });
  document.querySelector(".hero").classList.toggle("hidden-by-search", !!q);
});

/* ===== 맨 위로 버튼 ===== */
const toTop = document.getElementById("toTop");
addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 600), { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0 }));

/* ===== 학습 확인 퀴즈 ===== */
// O/X 문제: ox(DAY, 문장, 맞으면 true, 해설)
const ox = (day, q, isTrue, explain) => ({ day, q, options: ["O", "X"], answer: isTrue ? 0 : 1, explain, ox: true });

const QUIZ = [
  ox(1, "CLAUDE.md를 만드는 명령어는 /clear이다.", false, "CLAUDE.md는 /init으로 만듭니다. /clear는 대화를 비우는 명령어입니다."),
  ox(1, "바이브 코딩은 말로 설명하고 결과를 보며 다듬는 방식이다.", true, "코드를 외우지 않아도, 원하는 것을 말로 설명하고 결과를 보며 고쳐 나갑니다."),
  ox(1, "컨텍스트는 AI가 한 번에 기억할 수 있는 작업 공간이다.", true, "대화·읽은 파일·명령 결과가 여기에 쌓이고, 가득 차면 요약됩니다."),
  ox(1, "Claude in Chrome은 내 Chrome 브라우저를 대신 조작할 수 있다.", true, "로그인된 내 Chrome에서 페이지를 읽고 클릭·입력합니다."),
  ox(2, "GitHub는 데이터베이스 저장용이다.", false, "GitHub는 코드(Git 기록)를 온라인에 보관하는 곳입니다. 데이터베이스는 Supabase 같은 서비스가 맡습니다."),
  ox(2, "Git의 커밋(commit)은 파일을 인터넷에 올리는 것이다.", false, "커밋은 내 PC에 변경 기록을 저장하는 것이고, 인터넷(GitHub)에 올리는 것은 push입니다."),
  ox(2, "Vercel은 GitHub에 올린 사이트를 자동으로 배포해 준다.", true, "push하면 Vercel이 자동으로 다시 배포합니다."),
  ox(2, "Supabase는 회원가입·로그인과 데이터베이스를 제공한다.", true, "서버를 직접 만들지 않고 DB와 로그인 기능을 쓸 수 있습니다."),
  ox(2, "토스 시크릿 키는 브라우저 코드에 넣어도 된다.", false, "시크릿 키는 서버(환경 변수·Secrets)에만 둡니다."),
  ox(2, "MCP는 새로운 프로그래밍 언어이다.", false, "MCP는 AI에 외부 도구·데이터를 연결하는 표준 규격입니다."),
  ox(3, "스킬은 매번 직접 붙여 넣어야 하는 프롬프트이다.", false, "스킬은 폴더로 저장해 두면 Claude가 필요할 때 알아서 꺼내 쓰는 업무 매뉴얼입니다."),
  ox(4, "pandas는 엑셀 같은 표 데이터를 다루는 파이썬 도구이다.", true, "표를 읽고, 거르고, 묶어서 계산하고, 저장할 수 있습니다."),
  ox(4, "RAG는 내 문서를 검색해서 그걸 근거로 답하는 방식이다.", true, "검색으로 근거를 찾아 답하기 때문에 지어내는 답이 줄어듭니다."),
  ox(4, "로컬 LLM은 인터넷이 꼭 있어야 동작한다.", false, "로컬 LLM은 내 PC에서 직접 돌아가서 인터넷 없이도 동작합니다."),
  ox(4, "업스테이지의 Solar는 한국어에 강한 LLM이다.", true, "업스테이지는 한국 AI 회사이고, Solar는 API로 쓰는 LLM입니다."),
  ox(4, "에이전트는 질문에 한 번 대답하고 끝나는 AI이다.", false, "에이전트는 도구를 써 가며 목표를 이룰 때까지 스스로 여러 단계를 진행합니다."),
  ox(5, "STT는 글자를 음성으로 읽어 주는 기술이다.", false, "STT는 음성 → 글자, TTS가 글자 → 음성입니다."),
];

const DAY_NAMES = { 1: "Claude Code · 컨텍스트", 2: "배포 · Supabase · 결제 · MCP · 영상", 3: "스킬", 4: "pandas · RAG · 로컬 LLM · 에이전트", 5: "데스크톱 앱 · 자비스" };

const COMMENTS = [
  { min: 100, icon: "🏆", title: "완벽해요!", text: "모든 개념을 정확히 이해했어요. 이제 배운 내용으로 나만의 프로젝트를 Claude Code와 함께 만들어 보세요." },
  { min: 80, icon: "👏", title: "훌륭해요!", text: "핵심 개념을 거의 다 이해했어요. 틀린 문제의 해설만 확인하면 완벽합니다." },
  { min: 60, icon: "🙂", title: "좋아요, 기본은 탄탄해요", text: "큰 흐름은 잡혔어요. 아래에서 정답률이 낮은 DAY를 다시 읽어 보세요." },
  { min: 40, icon: "📚", title: "조금만 더 복습해요", text: "헷갈리는 개념이 꽤 있어요. 각 DAY의 '개념 먼저'와 'Claude Code로 진행하기' 부분을 다시 읽고 도전해 보세요." },
  { min: 0, icon: "🌱", title: "이제 시작이에요", text: "처음이라 어려운 게 당연해요. DAY 1부터 순서대로 천천히 읽은 뒤 다시 풀어 보세요." },
];

const quizForm = document.getElementById("quizForm");
const quizSubmit = document.getElementById("quizSubmit");
const quizRetry = document.getElementById("quizRetry");
const quizResult = document.getElementById("quizResult");
const quizCount = document.getElementById("quizCount");

function renderQuiz() {
  quizForm.innerHTML = "";
  QUIZ.forEach((item, i) => {
    const box = document.createElement("fieldset");
    box.className = item.ox ? "quiz-item ox" : "quiz-item";
    box.dataset.index = i;
    const legend = document.createElement("legend");
    legend.innerHTML = `<span class="quiz-tag">DAY ${item.day}</span><span class="quiz-no">Q${i + 1}.</span> `;
    legend.append(item.q);
    box.append(legend);
    const opts = document.createElement("div");
    opts.className = "quiz-opts";
    item.options.forEach((opt, j) => {
      const label = document.createElement("label");
      label.className = "quiz-opt";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "q" + i;
      input.value = j;
      label.append(input, document.createTextNode(opt));
      opts.append(label);
    });
    box.append(opts);
    const exp = document.createElement("p");
    exp.className = "quiz-explain";
    exp.hidden = true;
    box.append(exp);
    quizForm.append(box);
  });
  updateQuizCount();
}

function updateQuizCount() {
  const answered = QUIZ.filter((_, i) => quizForm.querySelector(`input[name="q${i}"]:checked`)).length;
  quizCount.textContent = `${answered} / ${QUIZ.length} 답함`;
  return answered;
}
quizForm.addEventListener("change", updateQuizCount);

quizSubmit.addEventListener("click", () => {
  const answered = updateQuizCount();
  if (answered < QUIZ.length) {
    const first = QUIZ.findIndex((_, i) => !quizForm.querySelector(`input[name="q${i}"]:checked`));
    const box = quizForm.children[first];
    box.classList.add("missing");
    box.scrollIntoView({ block: "center" });
    setTimeout(() => box.classList.remove("missing"), 1200);
    quizCount.textContent = `아직 ${QUIZ.length - answered}문제가 남았어요`;
    return;
  }

  let correct = 0;
  const byDay = {};
  QUIZ.forEach((item, i) => {
    const box = quizForm.children[i];
    const picked = Number(quizForm.querySelector(`input[name="q${i}"]:checked`).value);
    const ok = picked === item.answer;
    if (ok) correct++;
    byDay[item.day] = byDay[item.day] || { correct: 0, total: 0 };
    byDay[item.day].total++;
    if (ok) byDay[item.day].correct++;

    box.classList.add(ok ? "right" : "wrong");
    box.querySelectorAll(".quiz-opt").forEach((label, j) => {
      label.querySelector("input").disabled = true;
      if (j === item.answer) label.classList.add("answer");
      else if (j === picked) label.classList.add("picked-wrong");
    });
    const exp = box.querySelector(".quiz-explain");
    exp.textContent = (ok ? "✅ 정답! " : "❌ 오답. ") + item.explain;
    exp.hidden = false;
  });

  const rate = Math.round((correct / QUIZ.length) * 100);
  const comment = COMMENTS.find((c) => rate >= c.min);
  const days = Object.keys(byDay).map((d) => ({ day: d, ...byDay[d], rate: Math.round((byDay[d].correct / byDay[d].total) * 100) }));
  const weakest = days.filter((d) => d.rate < 100).sort((a, b) => a.rate - b.rate)[0];

  quizResult.innerHTML = `
    <div class="score-ring" style="--p:${rate}"><span>${rate}<small>%</small></span></div>
    <div class="score-body">
      <p class="score-sub">${QUIZ.length}문제 중 ${correct}문제 정답</p>
      <h3>${comment.icon} ${comment.title}</h3>
      <p>${comment.text}</p>
      ${weakest ? `<p class="score-weak">가장 복습이 필요한 곳: <a class="link" href="#day${weakest.day}">DAY ${weakest.day} ${DAY_NAMES[weakest.day]} (${weakest.rate}%)</a></p>` : ""}
      <div class="day-scores">
        ${days.map((d) => `
          <a class="day-score" href="#day${d.day}">
            <span>DAY ${d.day}</span>
            <div class="bar"><div style="width:${d.rate}%"></div></div>
            <b>${d.correct}/${d.total}</b>
          </a>`).join("")}
      </div>
    </div>`;
  quizResult.hidden = false;
  quizSubmit.hidden = true;
  quizRetry.hidden = false;
  quizCount.textContent = "채점 완료";
  quizResult.scrollIntoView({ block: "center" });
});

quizRetry.addEventListener("click", () => {
  renderQuiz();
  quizResult.hidden = true;
  quizSubmit.hidden = false;
  quizRetry.hidden = true;
  document.getElementById("quiz").scrollIntoView();
});

renderQuiz();

