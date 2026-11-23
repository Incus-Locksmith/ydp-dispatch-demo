// Build a fictional template once, so public visitors do not run PostgreSQL initdb.
process.env.YDP_DEMO_BUILD_SNAPSHOT='1';
const fs=require('fs'),path=require('path');
(async()=>{
 const {ready}=require('./server');await ready;
 const {db}=require('./demo-db');
 const dump=await db.dumpDataDir('gzip');
 const archive=path.join(__dirname,'demo-template.tgz'),folder=path.join(__dirname,'demo-template');
 fs.writeFileSync(archive,Buffer.from(await dump.arrayBuffer()));
 fs.rmSync(folder,{recursive:true,force:true});fs.mkdirSync(folder);
 require('child_process').execFileSync('tar',['-xzf',archive,'-C',folder],{stdio:'pipe'});
 fs.unlinkSync(archive);
 fs.writeFileSync(path.join(__dirname,'demo-template-meta.json'),JSON.stringify({generatedAt:new Date().toISOString()}));
 console.log('Fictional demo template prepared.');await db.close();
})().catch(e=>{console.error('Demo template build failed:',e.message);process.exit(1);});
