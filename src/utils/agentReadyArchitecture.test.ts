import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Agent-Ready Architecture & Guardrail Verification Suite (v2.2.0)', () => {
  const rootDir = process.cwd();

  it('1. package.json uses glob test discovery, tsx start script, enforces Node >=22.12.0, and omits legacy autoprefixer', () => {
    const pkgRaw = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(pkgRaw);

    assert.equal(
      pkg.scripts.test,
      'tsx --test "src/**/*.test.ts" "tests/**/*.test.ts"',
      'npm test must use glob pattern so newly added *.test.ts files are never silently skipped'
    );
    assert.equal(
      pkg.scripts.start,
      'tsx server.ts',
      'npm start must use tsx server.ts to avoid extension resolution errors during production startup'
    );
    assert.equal(
      pkg.engines?.node,
      '>=22.12.0',
      'engines.node must specify >=22.12.0'
    );
    assert.equal(
      pkg.devDependencies?.autoprefixer,
      undefined,
      'autoprefixer must not be present in devDependencies when using @tailwindcss/vite v4'
    );
  });

  it('2. pyproject.toml exists and defines Python >=3.11, pytorch_dit, and video_pilot packages', () => {
    const pyprojectPath = path.join(rootDir, 'pyproject.toml');
    assert.equal(fs.existsSync(pyprojectPath), true, 'pyproject.toml must exist at repository root');

    const content = fs.readFileSync(pyprojectPath, 'utf8');
    assert.match(content, /requires-python\s*=\s*">=3\.11"/);
    assert.match(content, /pytorch_dit\*/);
    assert.match(content, /video_pilot\*/);
    assert.match(content, /google-genai>=1\.0\.0/);
  });

  it('3. AGENTS.md and .cursorrules document Cross-Language Routing Rules between TypeScript and Python', () => {
    const agentsMd = fs.readFileSync(path.join(rootDir, 'AGENTS.md'), 'utf8');
    const cursorRules = fs.readFileSync(path.join(rootDir, '.cursorrules'), 'utf8');

    assert.match(agentsMd, /Cross-Language Routing Matrix/);
    assert.match(agentsMd, /src\/types\/studioEngineContracts\.ts/);
    assert.match(agentsMd, /docs\/api-schemas\.md/);
    assert.match(cursorRules, /Cross-Language Routing Rules/);
    assert.match(cursorRules, /pyproject\.toml/);
  });

  it('4. server.ts uses explicit .ts extensions on local relative imports for Node 22 ESM compatibility', () => {
    const serverContent = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
    const relativeImports = [...serverContent.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((m) => m[1]);

    assert.ok(relativeImports.length > 0, 'server.ts should have local relative imports');
    for (const relPath of relativeImports) {
      assert.ok(
        relPath.endsWith('.ts') || relPath.endsWith('.js') || relPath.endsWith('.json'),
        `Relative import "${relPath}" in server.ts must include an explicit file extension for Node 22 ESM`
      );
    }
  });

  it('5. AGENTS.md strictly separates TypeScript and Python and mandates tsx glob test runner', () => {
    const agentsMd = fs.readFileSync(path.join(rootDir, 'AGENTS.md'), 'utf8');

    // Strict separation
    assert.match(agentsMd, /Cross-Language Routing Matrix/);
    assert.match(agentsMd, /src\/utils\//);
    assert.match(agentsMd, /pytorch_dit\//);
    assert.match(agentsMd, /video_pilot\//);
    assert.match(agentsMd, /The web runtime \(`server\.ts` \+ Vite SPA\) is 100% Node\.js 22 \+ TypeScript/);

    // tsx testing mandate
    assert.match(agentsMd, /Mandatory 'tsx' Glob Test Execution & Silent Failure Prevention/);
    assert.match(agentsMd, /tsx --test "src\/\*\*\/\*\.test\.ts" "tests\/\*\*\/\*\.test\.ts"/);
    assert.match(agentsMd, /silently omits any newly created engine test suite/);
  });

  it('6. verifies all 10 Legal, Compliance, Tracking, Support, Governance, Architecture, and .github Template files exist and reference primary authority creatergame31@gmail.com', () => {
    const requiredDocs = [
      'LICENSE.md',
      'CODE_OF_CONDUCT.md',
      'PRIVACY.md',
      'CHANGELOG.md',
      'ROADMAP.md',
      'SUPPORT.md',
      'GOVERNANCE.md',
      'ARCHITECTURE.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE.md',
    ];

    for (const relFile of requiredDocs) {
      const fullPath = path.join(rootDir, relFile);
      assert.equal(fs.existsSync(fullPath), true, `${relFile} must exist on disk`);
      const text = fs.readFileSync(fullPath, 'utf8');
      assert.ok(text.trim().length > 200, `${relFile} must contain substantive documentation`);
      assert.match(
        text,
        /creatergame31@gmail\.com/,
        `${relFile} must include primary Administration / GM / Admin / Moderator contact creatergame31@gmail.com`
      );
    }
  });
});


