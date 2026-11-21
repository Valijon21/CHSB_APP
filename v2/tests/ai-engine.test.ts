import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processChatQuery } from '../src/lib/ai-engine';

describe('AI Conversational Analytics Engine', () => {
  it('should process overview prompt and return aggregated dashboard stats', async () => {
    const result = await processChatQuery('Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat');

    assert.ok(result);
    assert.equal(result.openUiComponent, 'OverviewDashboard');
    assert.ok(result.sqlExecuted.startsWith('SELECT'));
    assert.ok(result.data.length > 0);
    assert.ok(result.summary);
    assert.ok(result.pedagogicalInsight);
  });

  it('should process class-specific query and return class performance breakdown', async () => {
    const result = await processChatQuery('11-sinflar va boshqa sinflar kesimida CHSB natijalari');

    assert.ok(result);
    assert.equal(result.openUiComponent, 'ClassPerformance');
    assert.ok(result.data.length > 0);

    const firstRow = result.data[0] as { class_name?: string; avg_percentage?: number };
    assert.ok(firstRow.class_name);
    assert.ok(firstRow.avg_percentage !== undefined);
  });

  it('should process student at-risk roster query with PISA competency levels', async () => {
    const result = await processChatQuery('Past o‘zlashtirgan o‘quvchilar ro‘yxati va PISA darajalari');

    assert.ok(result);
    assert.equal(result.openUiComponent, 'StudentRoster');
    assert.ok(result.data.length > 0);

    const studentRow = result.data[0] as { student_name?: string; pisa_level?: string; grade?: string };
    assert.ok(studentRow.student_name);
    assert.ok(studentRow.pisa_level);
  });

  it('should process Bloom taxonomy and cognitive question difficulty query', async () => {
    const result = await processChatQuery('Bloom taksonomiyasi va savollar kognitiv qiyinligi tahlili');

    assert.ok(result);
    assert.equal(result.openUiComponent, 'BloomTaxonomy');
    assert.ok(result.sqlExecuted.includes('bloom_level'));
    assert.ok(result.data.length > 0);
    assert.ok(result.summary.includes('Bloom'));
    assert.ok(result.pedagogicalInsight);
  });
});
