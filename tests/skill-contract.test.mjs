import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skillPath = resolve(root, '.codex/skills/web2remotion/SKILL.md');

test('web2remotion skill declares a prompt-to-edit-table confirmation gate', () => {
  const skill = readFileSync(skillPath, 'utf8');

  assert.match(skill, /^description: Use when /m);
  assert.match(skill, /effect-catalog\/effects\.json/);
  assert.match(skill, /剪辑表格/);
  for (const field of ['shot', 'start', 'end', 'duration', 'source', 'target', 'effectId', 'params', 'prompt', 'status']) {
    assert.match(skill, new RegExp(`\\| ${field} \\|`), `missing stable table field: ${field}`);
  }
  assert.match(skill, /params.*JSON object/);
  assert.match(skill, /在用户明确回复“确认\/开始执行\/按此表执行”之前，必须停止在阶段一/);
  assert.match(skill, /没有得到用户明确确认前，不录制网页、不生成整片、不执行整体时间线/);
  assert.match(skill, /本阶段明确不负责：.*通用录制.*MP4 输出.*整体成片逻辑/s);
});
