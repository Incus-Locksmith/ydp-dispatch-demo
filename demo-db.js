// Isolated in-memory PostgreSQL for fictional demo sessions. Never reads DATABASE_URL.
const {PGlite}=require('@electric-sql/pglite');
const crypto=require('crypto');
const fs=require('fs'),path=require('path');
const templatePath=path.join(__dirname,'demo-template');
const loadedSnapshot=process.env.YDP_DEMO_BUILD_SNAPSHOT!=='1'&&fs.existsSync(path.join(templatePath,'PG_VERSION'));
let runtimeDirectory;
if(loadedSnapshot){runtimeDirectory=fs.mkdtempSync(path.join(require('os').tmpdir(),'ydp-demo-'));fs.cpSync(templatePath,runtimeDirectory,{recursive:true});}
const db=new PGlite({initialMemory:128*1024*1024,postgresqlconf:["shared_buffers='4MB'","work_mem='1MB'","maintenance_work_mem='8MB'"],...(loadedSnapshot?{dataDir:runtimeDirectory}:{})});
async function refreshSnapshotClock(){
 await db.waitReady;
 const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'demo-template-meta.json'),'utf8'));
 const elapsed=Date.now()-Date.parse(meta.generatedAt);
 if(!Number.isFinite(elapsed))throw new Error('Invalid demo template timestamp');
 const columns=(await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND data_type IN ('timestamp with time zone','timestamp without time zone')")).rows;
 for(const {table_name,column_name} of columns){const table='"'+table_name.replaceAll('"','""')+'"',col='"'+column_name.replaceAll('"','""')+'"';await db.query(`UPDATE ${table} SET ${col}=${col}+($1::interval) WHERE ${col} IS NOT NULL`,[elapsed+' milliseconds']);}
}
let gate=Promise.resolve();
const sessions=new Map();
async function query(sql,params=[]){
 const result=params.length?await db.query(sql,params):(await db.exec(sql)).at(-1);
 return {...result,rows:result?.rows||[],rowCount:result?.affectedRows??result?.rows?.length??0};
}
const pool={query,async connect(){return{query,release(){}};}};
function sessionMiddleware(req,res,next){
 const previous=gate;let release;gate=new Promise(r=>release=r);
 (async()=>{await previous;
  let released=false;const done=()=>{if(!released){released=true;release();}};
  res.once('finish',done);res.once('close',done);
  try{
   const cookie=(req.headers.cookie||'').match(/(?:^|;\s*)ydp_demo_id=([a-f0-9]{32})(?:;|$)/);
   let id=cookie?.[1];
   if(!id||!sessions.has(id)){
    id=crypto.randomBytes(16).toString('hex');const schema='demo_'+id;
    // Each browser receives its own schema copied only from the fictional template.
    await db.exec('CREATE SCHEMA '+schema);
    const tables=(await query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
    for(const {tablename} of tables){const name='"'+tablename.replaceAll('"','""')+'"';await db.exec(`CREATE TABLE ${schema}.${name} (LIKE public.${name} INCLUDING ALL); INSERT INTO ${schema}.${name} SELECT * FROM public.${name};`);}
    sessions.set(id,{schema,used:Date.now()});
    res.append('Set-Cookie',`ydp_demo_id=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${req.secure?'; Secure':''}`);
    if(sessions.size>8){const oldest=[...sessions].find(([key])=>key!==id);if(oldest){await db.exec('DROP SCHEMA '+oldest[1].schema+' CASCADE');sessions.delete(oldest[0]);}}
   }
   const session=sessions.get(id);session.used=Date.now();
   await db.exec('SET search_path TO '+session.schema+', public');
   req.demoSchema=session.schema;req.currentAgent='Demo Manager';req.currentRole='admin';
   next();
  }catch(error){console.error('Demo session error:',error.message);res.status(503).send('The demo is preparing a fresh workspace. Please refresh.');done();}
 })().catch(error=>{release();next(error);});
}
module.exports={pool,db,sessionMiddleware,loadedSnapshot,refreshSnapshotClock};
