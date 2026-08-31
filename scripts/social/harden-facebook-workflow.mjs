import { readFile, writeFile } from 'node:fs/promises'

const workflowPath = new URL('../../public/social/ace-child-grow/continuous-publisher-workflow.json', import.meta.url)
const workflow = JSON.parse(await readFile(workflowPath, 'utf8'))
const tableId = { __rl: true, value: 'REPLACE_WITH_FACEBOOK_PUBLISH_LEDGER_TABLE_ID', mode: 'id' }
const position = (x, y) => [x, y]
const code = (id, name, jsCode, x, y) => ({
  parameters: { jsCode }, id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: position(x, y),
})
const ifNode = (id, name, leftValue, rightValue, x, y) => ({
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id, leftValue, rightValue, operator: { type: typeof rightValue === 'boolean' ? 'boolean' : 'string', operation: typeof rightValue === 'boolean' ? 'true' : 'equals', singleValue: typeof rightValue === 'boolean' } }], combinator: 'and' } },
  id, name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: position(x, y),
})
const dataTable = (id, name, operation, filters, values, x, y, extra = {}) => ({
  parameters: {
    resource: 'row', operation, dataTableId: tableId, matchType: 'allConditions',
    filters: { conditions: filters },
    ...(values ? { columns: { mappingMode: 'defineBelow', value: values } } : {}),
    ...extra,
  },
  id, name, type: 'n8n-nodes-base.dataTable', typeVersion: 1.1, position: position(x, y),
  ...(operation === 'get' ? { alwaysOutputData: true } : {}),
})
const connect = (from, to, branch = 0) => {
  workflow.connections[from] ??= { main: [] }
  workflow.connections[from].main[branch] ??= []
  workflow.connections[from].main[branch].push({ node: to, type: 'main', index: 0 })
}

const managed = new Set([
  'Download Approved Media', 'Compute Downloaded Media SHA256', 'Compute Approved Content SHA256',
  'Validate Downloaded Hashes', 'Downloaded Hashes Match?', 'Read Durable Publish Ledger',
  'Fetch Recent ACE Child Grow Page Posts', 'Prepare Reservation or Reconciliation',
  'Upsert Publish Reservation or Reconciliation', 'Reserved by This Execution?',
  'Read Reservation Back', 'Confirm Reservation Ownership', 'Reservation Lease Owned?',
  'Fetch Published Post Permalink', 'Prepare Published Ledger Row', 'Upsert Published Ledger',
  'Alert Owner?', 'Prepare Durable Owner Alert', 'Upsert Durable Owner Alert',
  'Send Owner Alert - CREDENTIAL REQUIRED',
])
workflow.nodes = workflow.nodes.filter((node) => !managed.has(node.name))
for (const [name, value] of Object.entries(workflow.connections)) {
  if (managed.has(name)) delete workflow.connections[name]
  else value.main = value.main.map((branch) => (branch ?? []).filter((edge) => !managed.has(edge.node)))
}

const validation = workflow.nodes.find((node) =>
  ['Validate Kill Switch Approval and Duplicate Gates', 'Validate Kill Switch Approval and Queue Age Gates'].includes(node.name),
)
validation.name = 'Validate Kill Switch Approval and Queue Age Gates'
validation.parameters.jsCode = `const manifest = $json;
const now = Date.now();
const maxBacklogAgeMinutes = manifest.publisherPolicy?.maxBacklogAgeMinutes ?? 180;
const due = (Array.isArray(manifest.items) ? manifest.items : [])
  .filter((candidate) => candidate.status === 'scheduled' && candidate.approvalStatus === 'approved' && Date.parse(candidate.scheduledAt || 0) <= now && !candidate.alreadyPublished && !candidate.platformPostId && !candidate.platformPermalink)
  .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
const item = due[0] || null;
const blockers = [];
if (manifest.killSwitch !== false) blockers.push('GLOBAL_KILL_SWITCH_ON');
if (manifest.automationMode !== 'production') blockers.push('NOT_PRODUCTION_MODE');
if (manifest.destination?.platform !== 'facebook') blockers.push('WRONG_PLATFORM');
if (manifest.destination?.pageId !== '111009258047115') blockers.push('PAGE_NOT_ALLOWLISTED');
if (!/^v\\d+\\.\\d+$/.test(manifest.destination?.graphApiVersion || '')) blockers.push('INVALID_GRAPH_API_VERSION');
if (!item) blockers.push('NO_DUE_APPROVED_ITEM');
if (item) {
  item.mediaType = item.mediaType === 'photo' ? 'image' : item.mediaType;
  if ((now - Date.parse(item.scheduledAt)) / 60000 > maxBacklogAgeMinutes) blockers.push('STALE_DUE_ITEM_REQUIRES_REVIEW');
  if (!item.reviewerId || !item.approvalTimestamp) blockers.push('MISSING_APPROVAL_AUDIT');
  if (item.approvalExpiresAt && Date.parse(item.approvalExpiresAt) <= now) blockers.push('APPROVAL_EXPIRED');
  if (!item.captionMyanmar?.trim()) blockers.push('EMPTY_CAPTION');
  if (!item.mediaUrl?.startsWith('https://child.acegroup.com.mm/')) blockers.push('MEDIA_NOT_ON_APPROVED_HOST');
  if (!/^[a-f0-9]{64}$/i.test(item.mediaSha256 || '')) blockers.push('MISSING_OR_INVALID_MEDIA_HASH');
  if (!/^[a-f0-9]{64}$/i.test(item.approvedContentHash || '')) blockers.push('MISSING_OR_INVALID_APPROVED_HASH');
  if (!['image', 'reel'].includes(item.mediaType)) blockers.push('UNSUPPORTED_MEDIA_TYPE');
  if (item.mediaType === 'reel' && !/^https:\\/\\/child\\.acegroup\\.com\\.mm\\/.+\\.mp4(?:\\?.*)?$/i.test(item.mediaUrl || '')) blockers.push('REEL_MUST_BE_HOSTED_MP4');
  if (item.riskLevel === 'high' && !item.clinicalApprovalId) blockers.push('MISSING_CLINICAL_APPROVAL');
}
const quiet = new Set(['GLOBAL_KILL_SWITCH_ON', 'NO_DUE_APPROVED_ITEM']);
return [{ json: { ...(item || {}), dueCount: due.length, destinationPageId: manifest.destination?.pageId, graphApiVersion: manifest.destination?.graphApiVersion, eligible: blockers.length === 0, blockers, alertOwner: blockers.some((b) => !quiet.has(b)) } }];`

const eligible = workflow.nodes.find((node) => node.name === 'Eligible for Facebook Publish?')
eligible.position = position(700, 0)
const isReel = workflow.nodes.find((node) => node.name === 'Is Approved Item a Reel?')
isReel.position = position(3100, -80)
isReel.parameters.conditions.conditions[0].leftValue =
  "={{ $('Validate Downloaded Hashes').item.json.mediaType }}"

const photoPublish = workflow.nodes.find((node) =>
  node.name === 'Publish Photo to ACE Child Grow - CREDENTIAL REQUIRED',
)
photoPublish.parameters.url =
  "={{ 'https://graph.facebook.com/' + $('Validate Downloaded Hashes').item.json.graphApiVersion + '/' + $('Validate Downloaded Hashes').item.json.destinationPageId + '/photos' }}"
photoPublish.parameters.bodyParameters.parameters.find(({ name }) => name === 'url').value =
  "={{ $('Validate Downloaded Hashes').item.json.mediaUrl }}"
photoPublish.parameters.bodyParameters.parameters.find(({ name }) => name === 'message').value =
  "={{ $('Validate Downloaded Hashes').item.json.captionMyanmar }}"

const reelStart = workflow.nodes.find((node) =>
  node.name === 'Start Facebook Reel Upload - CREDENTIAL REQUIRED',
)
reelStart.parameters.url =
  "={{ 'https://graph.facebook.com/' + $('Validate Downloaded Hashes').item.json.graphApiVersion + '/' + $('Validate Downloaded Hashes').item.json.destinationPageId + '/video_reels' }}"

workflow.nodes.push(
  {
    parameters: { url: "={{ $json.mediaUrl }}", options: { response: { response: { responseFormat: 'file', outputPropertyName: 'data' } } } },
    id: 'download-approved-media', name: 'Download Approved Media', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: position(940, -100),
  },
  { parameters: { action: 'hash', binaryData: true, binaryPropertyName: 'data', type: 'SHA256', dataPropertyName: 'computedMediaSha256', encoding: 'hex' }, id: 'hash-media', name: 'Compute Downloaded Media SHA256', type: 'n8n-nodes-base.crypto', typeVersion: 2, position: position(1160, -100) },
  { parameters: { action: 'hash', binaryData: false, type: 'SHA256', value: "={{ $json.id + '|' + $json.scheduledAt + '|' + $json.captionMyanmar + '|' + $json.computedMediaSha256 }}", dataPropertyName: 'computedApprovedContentHash', encoding: 'hex' }, id: 'hash-content', name: 'Compute Approved Content SHA256', type: 'n8n-nodes-base.crypto', typeVersion: 2, position: position(1380, -100) },
  code('validate-downloaded-hashes', 'Validate Downloaded Hashes', `const blockers = [];
if ($json.computedMediaSha256 !== $json.mediaSha256) blockers.push('DOWNLOADED_MEDIA_HASH_MISMATCH');
if ($json.computedApprovedContentHash !== $json.approvedContentHash) blockers.push('APPROVED_CONTENT_HASH_MISMATCH');
return [{json: {...$json, eligible: blockers.length === 0, blockers, alertOwner: blockers.length > 0}}];`, 1600, -100),
  ifNode('downloaded-hashes-match', 'Downloaded Hashes Match?', '={{ $json.eligible }}', true, 1820, -100),
  dataTable('read-ledger', 'Read Durable Publish Ledger', 'get', [{ keyName: 'ledgerKey', condition: 'eq', keyValue: "={{ $('Validate Downloaded Hashes').item.json.id }}" }], null, 2040, -160, { returnAll: false, limit: 1 }),
  {
    parameters: { authentication: 'genericCredentialType', genericAuthType: 'httpBearerAuth', url: "={{ 'https://graph.facebook.com/' + $('Validate Downloaded Hashes').item.json.graphApiVersion + '/' + $('Validate Downloaded Hashes').item.json.destinationPageId + '/feed' }}", sendQuery: true, queryParameters: { parameters: [{ name: 'fields', value: 'id,message,permalink_url,created_time' }, { name: 'limit', value: '100' }] }, options: {} },
    id: 'fetch-page-feed', name: 'Fetch Recent ACE Child Grow Page Posts', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: position(2260, -160),
  },
  code('prepare-reservation', 'Prepare Reservation or Reconciliation', `const item = $('Validate Downloaded Hashes').item.json;
const ledger = $('Read Durable Publish Ledger').first()?.json || {};
const now = Date.now(); const executionId = $execution.id;
if (['published','reconciled'].includes(ledger.status)) return [{json:{action:'SKIP', ...ledger}}];
if (ledger.status === 'reserved' && ledger.reservationToken !== executionId && Date.parse(ledger.reservationExpiresAt || 0) > now) return [{json:{action:'SKIP', ...ledger}}];
const match = ($json.data || []).find((p) => p.id && p.message === item.captionMyanmar && Math.abs(Date.parse(p.created_time || 0) - Date.parse(item.scheduledAt)) <= 604800000);
const base = {ledgerKey:item.id,postId:item.id,approvedContentHash:item.approvedContentHash,mediaSha256:item.mediaSha256,scheduledAt:item.scheduledAt,lastExecutionId:executionId,updatedAt:new Date(now).toISOString(),alertCode:'',alertMessage:''};
if (match) return [{json:{action:'RECONCILED',...base,status:'reconciled',reservationToken:'',reservationExpiresAt:'',platformPostId:match.id,platformPermalink:match.permalink_url || '',publishedAt:match.created_time || new Date(now).toISOString()}}];
return [{json:{action:'RESERVE',...base,status:'reserved',reservationToken:executionId,reservationExpiresAt:new Date(now+600000).toISOString(),platformPostId:'',platformPermalink:'',publishedAt:''}}];`, 2480, -160),
  dataTable('upsert-reservation', 'Upsert Publish Reservation or Reconciliation', 'upsert', [{ keyName: 'ledgerKey', condition: 'eq', keyValue: '={{ $json.ledgerKey }}' }], { ledgerKey: '={{ $json.ledgerKey }}', postId: '={{ $json.postId }}', status: '={{ $json.status }}', reservationToken: '={{ $json.reservationToken }}', reservationExpiresAt: '={{ $json.reservationExpiresAt }}', approvedContentHash: '={{ $json.approvedContentHash }}', mediaSha256: '={{ $json.mediaSha256 }}', platformPostId: '={{ $json.platformPostId }}', platformPermalink: '={{ $json.platformPermalink }}', publishedAt: '={{ $json.publishedAt }}', scheduledAt: '={{ $json.scheduledAt }}', lastExecutionId: '={{ $json.lastExecutionId }}', alertCode: '={{ $json.alertCode }}', alertMessage: '={{ $json.alertMessage }}', updatedAt: '={{ $json.updatedAt }}' }, 2700, -160),
  ifNode('reserved-this-execution', 'Reserved by This Execution?', "={{ $('Prepare Reservation or Reconciliation').item.json.action }}", 'RESERVE', 2900, -160),
  dataTable('read-reservation-back', 'Read Reservation Back', 'get', [{ keyName: 'ledgerKey', condition: 'eq', keyValue: "={{ $('Validate Downloaded Hashes').item.json.id }}" }], null, 2900, 20, { returnAll: false, limit: 1 }),
  code('confirm-reservation-owner', 'Confirm Reservation Ownership', `const row=$json; const owns=row.status==='reserved' && row.reservationToken===$execution.id && Date.parse(row.reservationExpiresAt||0)>Date.now(); return [{json:{...row,ownsReservation:owns,blockers:owns?[]:['RESERVATION_NOT_OWNED'],alertOwner:false}}];`, 3100, 20),
  ifNode('lease-owned', 'Reservation Lease Owned?', '={{ $json.ownsReservation }}', true, 3300, 20),
  {
    parameters: { authentication: 'genericCredentialType', genericAuthType: 'httpBearerAuth', url: "={{ 'https://graph.facebook.com/' + $('Validate Downloaded Hashes').item.json.graphApiVersion + '/' + $json.platformPostId }}", sendQuery: true, queryParameters: { parameters: [{ name: 'fields', value: 'id,permalink_url,created_time' }] }, options: {} },
    id: 'fetch-permalink', name: 'Fetch Published Post Permalink', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: position(3820, -80),
  },
  code('prepare-published-ledger', 'Prepare Published Ledger Row', `const item=$('Validate Downloaded Hashes').item.json; const remembered=$('Remember Published Post').item.json; const platformPostId=$json.id || remembered.platformPostId; if(!platformPostId) throw new Error('PLATFORM_POST_ID_REQUIRED'); return [{json:{ledgerKey:item.id,postId:item.id,status:'published',reservationToken:'',reservationExpiresAt:'',approvedContentHash:item.approvedContentHash,mediaSha256:item.mediaSha256,platformPostId,platformPermalink:$json.permalink_url || '',publishedAt:$json.created_time || remembered.publishedAt || new Date().toISOString(),scheduledAt:item.scheduledAt,lastExecutionId:$execution.id,alertCode:$json.permalink_url?'':'PERMALINK_RECONCILIATION_REQUIRED',alertMessage:$json.permalink_url?'':'Facebook returned a post ID but no permalink; reconcile before any retry.',updatedAt:new Date().toISOString()}}];`, 4040, -80),
  dataTable('upsert-published-ledger', 'Upsert Published Ledger', 'upsert', [{ keyName: 'ledgerKey', condition: 'eq', keyValue: '={{ $json.ledgerKey }}' }], { ledgerKey: '={{ $json.ledgerKey }}', postId: '={{ $json.postId }}', status: '={{ $json.status }}', reservationToken: '={{ $json.reservationToken }}', reservationExpiresAt: '={{ $json.reservationExpiresAt }}', approvedContentHash: '={{ $json.approvedContentHash }}', mediaSha256: '={{ $json.mediaSha256 }}', platformPostId: '={{ $json.platformPostId }}', platformPermalink: '={{ $json.platformPermalink }}', publishedAt: '={{ $json.publishedAt }}', scheduledAt: '={{ $json.scheduledAt }}', lastExecutionId: '={{ $json.lastExecutionId }}', alertCode: '={{ $json.alertCode }}', alertMessage: '={{ $json.alertMessage }}', updatedAt: '={{ $json.updatedAt }}' }, 4260, -80),
  ifNode('alert-owner', 'Alert Owner?', '={{ $json.alertOwner }}', true, 1160, 260),
  code('prepare-owner-alert', 'Prepare Durable Owner Alert', `const blockers=$json.blockers || ['UNKNOWN_PUBLISHER_BLOCKER']; const code=blockers.join(','); const postId=$json.id || $json.postId || ''; const day=new Date().toISOString().slice(0,10); return [{json:{ledgerKey:postId?('alert:'+postId+':'+code):('alert:'+day+':'+code),postId,status:'alert',reservationToken:'',reservationExpiresAt:'',approvedContentHash:'',mediaSha256:'',platformPostId:'',platformPermalink:'',publishedAt:'',scheduledAt:'',lastExecutionId:$execution.id,alertCode:code,alertMessage:'ACE Child Grow Facebook publisher blocked: '+code,updatedAt:new Date().toISOString()}}];`, 1380, 260),
  dataTable('upsert-owner-alert', 'Upsert Durable Owner Alert', 'upsert', [{ keyName: 'ledgerKey', condition: 'eq', keyValue: '={{ $json.ledgerKey }}' }], { ledgerKey: '={{ $json.ledgerKey }}', postId: '={{ $json.postId }}', status: '={{ $json.status }}', reservationToken: '', reservationExpiresAt: '', approvedContentHash: '', mediaSha256: '', platformPostId: '', platformPermalink: '', publishedAt: '', scheduledAt: '', lastExecutionId: '={{ $json.lastExecutionId }}', alertCode: '={{ $json.alertCode }}', alertMessage: '={{ $json.alertMessage }}', updatedAt: '={{ $json.updatedAt }}' }, 1600, 260),
  { parameters: { resource: 'email', operation: 'send', fromEmail: 'REPLACE_WITH_SOCIAL_ALERT_FROM_EMAIL', toEmail: 'REPLACE_WITH_SOCIAL_OWNER_ALERT_EMAIL', subject: '={{ "ACE Child Grow Facebook publisher blocked: " + $json.alertCode }}', emailFormat: 'text', text: '={{ $json.alertMessage + "\\nPost: " + ($json.postId || "none") + "\\nExecution: " + $json.lastExecutionId + "\\nRecorded: " + $json.updatedAt }}', options: { appendAttribution: false } }, id: 'send-owner-alert', name: 'Send Owner Alert - CREDENTIAL REQUIRED', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: position(1820, 260), onError: 'continueRegularOutput' },
)

const mark = workflow.nodes.find((node) => node.name === 'Remember Published Post')
mark.parameters.jsCode = `const item=$('Validate Downloaded Hashes').item.json; const response=$json; if(item.mediaType==='reel' && response.success!==true) throw new Error('META_REEL_PUBLISH_FAILED'); const platformPostId=item.mediaType==='reel' ? $('Start Facebook Reel Upload - CREDENTIAL REQUIRED').item.json.video_id : (response.post_id || response.id); if(!platformPostId) throw new Error('META_RESPONSE_MISSING_POST_ID'); return [{json:{result:'META_PUBLISHED_PENDING_LEDGER',postId:item.id,platformPostId,mediaType:item.mediaType,publishedAt:new Date().toISOString()}}];`
mark.position = position(3600, -80)

workflow.connections = {}
connect('Check Queue Every 15 Minutes', 'Load Public Approved Manifest')
connect('Manual Trigger', 'Load Public Approved Manifest')
connect('Load Public Approved Manifest', 'Validate Kill Switch Approval and Queue Age Gates')
connect('Validate Kill Switch Approval and Queue Age Gates', 'Eligible for Facebook Publish?')
connect('Eligible for Facebook Publish?', 'Download Approved Media', 0)
connect('Eligible for Facebook Publish?', 'Block and Flag Owner', 1)
connect('Block and Flag Owner', 'Alert Owner?')
connect('Downloaded Hashes Match?', 'Read Durable Publish Ledger', 0)
connect('Downloaded Hashes Match?', 'Prepare Durable Owner Alert', 1)
connect('Download Approved Media', 'Compute Downloaded Media SHA256')
connect('Compute Downloaded Media SHA256', 'Compute Approved Content SHA256')
connect('Compute Approved Content SHA256', 'Validate Downloaded Hashes')
connect('Validate Downloaded Hashes', 'Downloaded Hashes Match?')
connect('Read Durable Publish Ledger', 'Fetch Recent ACE Child Grow Page Posts')
connect('Fetch Recent ACE Child Grow Page Posts', 'Prepare Reservation or Reconciliation')
connect('Prepare Reservation or Reconciliation', 'Upsert Publish Reservation or Reconciliation')
connect('Upsert Publish Reservation or Reconciliation', 'Reserved by This Execution?')
connect('Reserved by This Execution?', 'Read Reservation Back', 0)
connect('Read Reservation Back', 'Confirm Reservation Ownership')
connect('Confirm Reservation Ownership', 'Reservation Lease Owned?')
connect('Reservation Lease Owned?', 'Is Approved Item a Reel?', 0)
connect('Is Approved Item a Reel?', 'Start Facebook Reel Upload - CREDENTIAL REQUIRED', 0)
connect('Is Approved Item a Reel?', 'Publish Photo to ACE Child Grow - CREDENTIAL REQUIRED', 1)
connect('Start Facebook Reel Upload - CREDENTIAL REQUIRED', 'Confirm Facebook Reel Upload Session')
connect('Confirm Facebook Reel Upload Session', 'Upload Hosted Reel to Meta - CREDENTIAL REQUIRED')
connect('Upload Hosted Reel to Meta - CREDENTIAL REQUIRED', 'Confirm Facebook Reel Upload')
connect('Confirm Facebook Reel Upload', 'Publish Facebook Reel - CREDENTIAL REQUIRED')
connect('Publish Facebook Reel - CREDENTIAL REQUIRED', 'Remember Published Post')
connect('Publish Photo to ACE Child Grow - CREDENTIAL REQUIRED', 'Remember Published Post')
connect('Remember Published Post', 'Fetch Published Post Permalink')
connect('Fetch Published Post Permalink', 'Prepare Published Ledger Row')
connect('Prepare Published Ledger Row', 'Upsert Published Ledger')
connect('Alert Owner?', 'Prepare Durable Owner Alert', 0)
connect('Prepare Durable Owner Alert', 'Upsert Durable Owner Alert')
connect('Upsert Durable Owner Alert', 'Send Owner Alert - CREDENTIAL REQUIRED')

workflow.active = false
workflow.settings.executionTimeout = 300
workflow.versionId = '00000000-0000-4000-8000-000000000004'
workflow.meta.publishLedgerRequired = true
workflow.meta.publishLedgerTableIdPlaceholder = tableId.value
workflow.meta.ownerAlertCredentialRequired = true
delete workflow.meta.ownerAlertVariablesRequired
workflow.meta.ownerAlertFieldPlaceholders = [
  'REPLACE_WITH_SOCIAL_ALERT_FROM_EMAIL',
  'REPLACE_WITH_SOCIAL_OWNER_ALERT_EMAIL',
]
delete workflow.meta.killSwitchExpected

for (const node of workflow.nodes) {
  node.parameters = JSON.parse(
    JSON.stringify(node.parameters).replaceAll(
      'Validate Kill Switch Approval and Duplicate Gates',
      'Validate Kill Switch Approval and Queue Age Gates',
    ),
  )
}

await writeFile(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`)
