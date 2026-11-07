import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCaptureSetup} from '../../../lets/src/backlog/capture-client.ts';
test('capture setup cannot be replaced by an editable agent report',async()=>{
  await assert.rejects(readCaptureSetup({protect:async()=>{throw Error('editable');},read:async()=>JSON.stringify({socket:'fake'})}),/administrator capture setup/);
});
