const https = require('https');

const USERNAME = 'fahimahmed420';

function get(path) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'stats-svg-generator',
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    https.get(
      {
        hostname: 'api.github.com',
        path,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API ${path} failed: ${res.statusCode} ${data}`));
            return;
          }
          resolve(JSON.parse(data));
        });
      }
    ).on('error', reject);
  });
}

async function main() {
  const user = await get(`/users/${USERNAME}`);

  let repos = [];
  let page = 1;
  while (true) {
    const batch = await get(`/users/${USERNAME}/repos?per_page=100&page=${page}`);
    repos = repos.concat(batch);
    if (batch.length < 100) break;
    page += 1;
  }

  const stars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const forks = repos.reduce((sum, r) => sum + r.forks_count, 0);

  const updated = new Date().toISOString().slice(0, 10);

  const svg = `<svg width="450" height="170" viewBox="0 0 450 170" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Ubuntu, Sans-Serif">
  <style>
    .title { fill: #58a6ff; font-size: 16px; font-weight: 600; }
    .label { fill: #c9d1d9; font-size: 13px; }
    .value { fill: #58a6ff; font-size: 13px; font-weight: 600; }
    .bg { fill: #0d1117; stroke: #30363d; stroke-width: 1; }
    .footer { fill: #8b949e; font-size: 11px; }
  </style>
  <rect class="bg" x="0.5" y="0.5" width="449" height="169" rx="6"/>
  <text x="25" y="32" class="title">${USERNAME}'s GitHub Stats</text>

  <text x="25" y="65" class="label">Public Repos:</text>
  <text x="420" y="65" class="value" text-anchor="end">${user.public_repos}</text>

  <text x="25" y="90" class="label">Total Stars Earned:</text>
  <text x="420" y="90" class="value" text-anchor="end">${stars}</text>

  <text x="25" y="115" class="label">Total Forks:</text>
  <text x="420" y="115" class="value" text-anchor="end">${forks}</text>

  <text x="25" y="140" class="label">Followers:</text>
  <text x="420" y="140" class="value" text-anchor="end">${user.followers}</text>

  <text x="25" y="160" class="footer">Auto-updated ${updated} via GitHub Actions</text>
</svg>
`;

  require('fs').writeFileSync(`${__dirname}/../stats.svg`, svg);
  console.log('stats.svg regenerated:', { repos: user.public_repos, stars, forks, followers: user.followers });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
