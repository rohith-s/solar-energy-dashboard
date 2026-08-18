export function render() {
  const month = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(new Date());

  return `
    <section class="page dashboard-page" aria-labelledby="dashboard-title">
      <div class="page-header">
        <div>
          <p class="eyebrow">Energy overview</p>
          <h1 id="dashboard-title" class="page-title">Good evening 👋</h1>
          <p class="page-description">Track your solar generation, grid import and export for ${month}.</p>
        </div>
        <a class="button" href="#/reading">＋ Add Reading</a>
      </div>

      <div class="card placeholder-card">
        <div>
          <div class="placeholder-icon" aria-hidden="true">▣</div>
          <h2>Dashboard data will appear here</h2>
          <p>Commit 3 will connect this screen to the reading and calculation engine.</p>
        </div>
      </div>
    </section>`;
}
