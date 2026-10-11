import test from 'node:test';
import assert from 'node:assert/strict';
import {redactEvidenceURL,publishedPageEvidence} from './page-evidence-publication.mjs';
test('publication removes query, fragment and URL credentials while preserving route context',()=>{
 const input='https://person:secret@example.test/login?invite=local-preview&token_hash=private&next=%2Fdashboard#access_token=private&state=visible';
 const result=redactEvidenceURL(input);
 assert.doesNotMatch(result,/person|secret|local-preview|private/);
 assert.match(result,/\/login\?/);assert.match(result,/next=%2Fdashboard/);assert.match(result,/state=visible/);
 assert.equal(redactEvidenceURL('/signup?INVITE=private'),'/signup?INVITE=REDACTED');
 assert.equal(redactEvidenceURL('http://localhost:3600/documents?page=2#details'),'http://localhost:3600/documents?page=2#details');
});
test('publication does not mutate private evidence or change counts, image hashes and verdicts',()=>{
 const input={products:[{summary:{images:3,reviewedImages:3},evidence:[{url:'http://localhost:3600/signup?invite=private',actualURL:'http://localhost:3600/callback?code=private',images:[{hash:'exact-image',verdict:'finding-present'}]}]}]};
 const result=publishedPageEvidence(input);
 assert.match(input.products[0].evidence[0].url,/invite=private/);
 assert.doesNotMatch(JSON.stringify(result),/private/);
 assert.deepEqual(result.products[0].summary,input.products[0].summary);
 assert.deepEqual(result.products[0].evidence[0].images,input.products[0].evidence[0].images);
});
