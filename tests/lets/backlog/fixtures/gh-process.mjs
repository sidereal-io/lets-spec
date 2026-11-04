import { readFileSync, writeFileSync } from 'node:fs';
let input = ''; for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input); const name = request.query.match(/(?:query|mutation) (\w+)/)[1];
const path = process.env.BACKLOG_TEST_STATE;
const state = JSON.parse(readFileSync(path, 'utf8')); const { responses } = state;
state.calls.push({ name, variables: request.variables });
const variables = request.variables;
if (responses._fault === 'before:' + name) { writeFileSync(path, JSON.stringify(state)); console.log(JSON.stringify({errors:[{type:'FORBIDDEN'}]})); process.exit(1); }
if (name === 'FieldText' || name === 'FieldStatus') {
  const nodes = responses.ItemValues.node.fieldValues.nodes;
  const value = nodes.find(value => value.field?.id === variables.field);
  const replacement = { field: { id: variables.field }, ...(name === 'FieldText' ? { text: variables.text } : { optionId: variables.option }) };
  if (value) Object.assign(value, replacement); else nodes.push(replacement);
}
if (name === 'Assign') responses.IssueOwners.node.assignees.nodes = [{ login: 'me', id: variables.actor }];
writeFileSync(path, JSON.stringify(state));
if (responses._fault === 'after:' + name) process.exit(1);
console.log(JSON.stringify({ data: responses[name + ':' + variables.id] ?? responses[name] ?? {} }));
