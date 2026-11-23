const {app,ready}=require('./server'),assert=require('assert');
(async()=>{await ready;const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const browser=()=>({cookie:''}),a=browser(),b=browser();
async function req(client,path,data){const res=await global.fetch(base+path,{method:data?'POST':'GET',headers:{cookie:client.cookie,...(data?{'content-type':'application/x-www-form-urlencoded'}:{})},body:data?new URLSearchParams(data):undefined,redirect:'manual'});const c=res.headers.get('set-cookie');if(c?.includes('ydp_demo_id='))client.cookie=c.split(';')[0];return {status:res.status,text:await res.text(),location:res.headers.get('location')};}
let r=await req(a,'/jobs');assert.equal(r.status,200);assert(r.text.includes('Live client orders'));assert(r.text.includes('LK-1001'));assert(!r.text.includes('Amelia Example')||r.text.includes('Example'));
await req(b,'/jobs');assert.notEqual(a.cookie,b.cookie);
r=await req(a,'/jobs/1001/quick-assign',{assigned_technician_id:'4'});assert.equal(r.status,302);r=await req(a,'/jobs/1001/edit');assert(r.text.includes('Taylor Hughes'));
r=await req(b,'/jobs/1001/edit');assert(r.text.includes('Alex Turner'));assert(!r.text.includes('assigned_technician_id changed from'));
r=await req(a,'/jobs/1001/quick-status',{status:'awaiting_payment'});assert.equal(r.status,302);
r=await req(a,'/jobs/create',{customer_name:'Integration Test Customer',customer_phone:'07700900900',customer_email:'demo@example.com',address_line_1:'1 Example Street',postcode:'NW16XE',latitude:'51.5225',longitude:'-0.16',job_type:'LOCKOUT',job_description:'Fictional test lockout',urgency:'Normal',source_campaign:'Website enquiry',quoted_price:'145',starting_price:'55',call_out_agreed:'45',assigned_technician_id:'1',eta:'30-45 mins'});assert.equal(r.status,302,r.text);const created=r.location;
r=await req(a,created);assert(r.text.includes('Integration Test Customer'));
r=await req(a,'/jobs/1002/close',{net_value:'150',payment_method_1:'Card',payment_amount_1:'180',customer_paid:'true',invoice_photos_confirmed:'true',status:'fully_paid',materials_cost:'25',outcome:'Completed',tech_notes:'Fictional test completion'});assert.equal(r.status,302,r.text);
r=await req(a,'/disputes/1/refund/approve',{refund_amount:'35',note:'Fictional approval test'});assert.equal(r.status,302,r.text);r=await req(a,'/disputes/1');assert(r.text.includes('Refund approved'));
r=await req(b,'/disputes/1');assert(r.text.includes('/disputes/1/refund/approve'));assert(!r.text.includes('Fictional approval test'));
for(const path of ['/jobs','/jobs/new','/jobs/1001/edit','/jobs/1002/close','/technicians','/dispatch','/call-wallboard','/api/call-wallboard/live','/disputes','/disputes/1','/payment-chasing','/quotations','/quotations/new','/invoices','/invoices/1/edit','/reports','/reports/management','/reports/daily-operations','/technician-leaderboard','/demo/forecast','/tech-workspace/demo-tech-2','/tech-workspace/demo-tech-2/summary','/tech-workspace/demo-tech-2/disputes']){r=await req(a,path);assert.equal(r.status,200,path+' '+r.text.slice(-300));console.log('GET PASS',path);}
for(const path of ['/admin/users','/debug','/webhook/yay','/api/postcoder-addresses']){r=await req(a,path);assert.equal(r.status,403,path);}
r=await req(a,'/jobs/1001/send-sms',{message:'test'});assert.equal(r.status,403);
r=await req(a,'/demo/reset',{});assert.equal(r.status,302);a.cookie='';r=await req(a,'/jobs?status=all');assert(!r.text.includes('Integration Test Customer'));
console.log('PASS: original UI routes, assignment, job creation, closing, refund approval, browser-session isolation, blocked connected services, reset. RSS MB',Math.round(process.memoryUsage().rss/1024/1024));server.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
