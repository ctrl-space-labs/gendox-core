const fs = require('fs');
const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath } = require('../../support/domain');
const documents = require('../../page-objects/apis/documents');

/**
 * Processing turns an uploaded document into sections (splitter job) and makes those sections
 * searchable (training job, embeddings). These tests describe what a user expects from it, with
 * the mock embedding model, and do not depend on how the jobs choose what to process.
 *
 * "Searchable" means semantic search in the agent returns a section of the document: the
 * user-visible effect of both jobs having run for it.
 */

// Long enough for the upload poller (every 10 s) and both jobs, with the mock models.
const PROCESSED_WITHIN = 90_000;

const setAutomaticProcessing = async (api, w, on) => {
    const project = await json(await call(api, w, 'get', projectPath(w)));
    await ok(await call(api, w, 'put', projectPath(w), { ...project, autoTraining: on }));
};

// A text file of its own, so each document has a name and content no other test shares.
const uploadText = async (api, w, testInfo, name) => {
    const file = testInfo.outputPath(`${name}.txt`);
    fs.writeFileSync(file, `${name}\n\nThe method of least squares fits a line to measured points (${name}).\n`);
    await ok(await documents.uploadDocument(api, w.ownerToken, w.organizationId, w.projectId, file));
    const listing = await json(await call(api, w, 'get', `${projectPath(w)}/documents?size=100`));
    const document = listing.content.find(d => d.title === name);
    expect(document, `${name} is in the agent's documents`).toBeTruthy();
    return document;
};

// "Process now", the button in the agent settings and the knowledge page
const processNow = async (api, w) =>
    ok(await call(api, w, 'get', `${projectPath(w)}/splitting/training?jobName=SPLITTER_AND_TRAINING&projectId=${w.projectId}`));

const sectionCount = async (api, w, documentId) => {
    const document = await json(await call(api, w, 'get', `/documents/${documentId}`));
    return document.documentInstanceSections?.length ?? 0;
};

const searchableIds = async (api, w) => {
    const sections = await json(await call(api, w, 'post', `/messages/search?projectId=${w.projectId}&size=100`, { value: 'least squares' }));
    return new Set(sections.map(section => section.documentInstanceDTO?.id));
};

const expectSearchable = (api, w, document) =>
    expect.poll(async () => (await searchableIds(api, w)).has(document.id), {
        message: `${document.title} is found by semantic search`,
        timeout: PROCESSED_WITHIN,
        intervals: [2000, 3000, 5000],
    }).toBe(true);

const expectSplit = (api, w, document) =>
    expect.poll(() => sectionCount(api, w, document.id), {
        message: `${document.title} has sections`,
        timeout: PROCESSED_WITHIN,
        intervals: [2000, 3000, 5000],
    }).toBeGreaterThan(0);

test.describe('Document processing', { tag: ['@background', '@p1'] }, () => {
    test('with automatic processing on, an uploaded document becomes searchable with no further action', async ({ api, workspace: w }, testInfo) => {
        test.setTimeout(150_000);
        await setAutomaticProcessing(api, w, true);
        const document = await uploadText(api, w, testInfo, 'auto-processed');
        await expectSearchable(api, w, document);
    });

    test('with automatic processing off, "Process now" makes the uploaded documents searchable', async ({ api, workspace: w }, testInfo) => {
        test.setTimeout(150_000);
        await setAutomaticProcessing(api, w, false);
        const document = await uploadText(api, w, testInfo, 'processed-by-hand');
        await processNow(api, w);
        await expectSplit(api, w, document);
        await expectSearchable(api, w, document);
    });

    test('a document processed while automatic processing was off is searchable once it is turned on', async ({ api, workspace: w }, testInfo) => {
        test.setTimeout(240_000);
        await setAutomaticProcessing(api, w, false);
        const earlier = await uploadText(api, w, testInfo, 'before-turning-on');
        await processNow(api, w);
        await expectSplit(api, w, earlier);

        await setAutomaticProcessing(api, w, true);
        const later = await uploadText(api, w, testInfo, 'after-turning-on');
        await expectSearchable(api, w, later);
        // the next run went through; nothing the earlier one left half done may stay behind
        await expectSearchable(api, w, earlier);
    });
});
