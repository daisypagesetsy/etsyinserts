const $=id=>document.getElementById(id);let models=[],items=[],active=0,urls=[];
fetch('/models.json').then(r=>r.json()).then(data=>{models=data;for(const brand of [...new Set(data.map(m=>m.brand))]){let g=document.createElement('optgroup');g.label=brand;data.forEach((m,i)=>{if(m.brand===brand)g.append(new Option(m.name.replace(/ \(.*?\)/g,''),i))});$('model').append(g)}$('model').value='0'}).catch(()=>{$('status').textContent='Unable to load models. Custom measured sizing is still available.'});
function options(){const opts=Object.fromEntries(['title','shop','width','height','radius','fit'].map(id=>[id,$(id).value]));for(const id of ['width','height','radius'])opts[id]=Number(opts[id])*10;return opts}
function update(){const w=+$('width').value*10,h=+$('height').value*10,r=+$('radius').value*10;let valid=w>=30&&w<=400&&h>=30&&h<=400&&r>=0&&r<=Math.min(30,w/2,h/2);$('generate').disabled=!items.length||!valid;if(valid){$('insert').style.aspectRatio=w+'/'+h;$('insert').style.borderRadius=(r/w*240)+'px'}$('preview').style.objectFit=$('fit').value;let item=items[active];if(item&&valid){const dpi=($('fit').value==='cover'?Math.min:Math.max)(item.width/(w/25.4),item.height/(h/25.4));$('quality').textContent=Math.round(dpi)+' DPI at this print size';$('qualitydetail').textContent=`${item.width} × ${item.height} pixels · ${dpi>=300?'Meets the 300 DPI print target.':'Below 300 DPI. A larger original will give finer detail.'}`;}if(items.length)$('status').textContent=!valid?'Enter valid case dimensions and radius.':`${items.length} design${items.length>1?'s':''} ready. ${$('package').value==='bundle'?'One bundle ZIP.':'Each gets its own ZIP.'}`}
function show(i){active=i;$('preview').src=items[i].url;$('preview').style.display='block';$('placeholder').style.display='none';update()}
$('files').onchange=async()=>{items.forEach(i=>URL.revokeObjectURL(i.url));items=[];$('queue').replaceChildren();for(const file of $('files').files){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>28*1024*1024){$('status').textContent='Use PNG, JPEG or WebP files below 28 MB each.';continue}try{const url=URL.createObjectURL(file),img=new Image();img.src=url;await img.decode();items.push({file,url,width:img.naturalWidth,height:img.naturalHeight});let b=document.createElement('button');const index=items.length-1;b.textContent=file.name;b.onclick=()=>show(index);$('queue').append(b)}catch{$('status').textContent='An image could not be opened.'}}if(items.length)show(0);else{$('preview').style.display='none';$('placeholder').style.display='grid';update()}};
$('model').onchange=()=>{const m=models[$('model').value];if(!m?.w)$('advanced').open=true;$('width').value=m?Number((m.w/10).toFixed(3)):'';$('height').value=m?Number((m.h/10).toFixed(3)):'';$('modelnote').textContent=m?.w?'Sample device body dimensions. Measure your case; preset fit is not verified.':'Enter your measured case width and height in centimeters.';update()};for(const id of ['width','height','radius','fit'])$(id).oninput=update;
function imageData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)})}
function designTitle(item,opts,count){const filename=item.file.name.replace(/\.[^.]+$/,'');return opts.title.trim()?(count>1?opts.title+' · '+filename:opts.title):filename}
function downloadLink(blob,title){const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=(title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'insert')+'.zip';a.textContent='↓ Download '+title+` (${(blob.size/1048576).toFixed(1)} MB)`;$('downloads').append(a)}
async function exportZip(route,payload){const response=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok)throw Error((await response.json()).error);return response.blob()}
$('package').onchange=update;
$('generate').onclick=async()=>{
 const opts=options(),selected=[...items],mode=$('package').value;
 $('generate').disabled=true;$('files').disabled=true;
 urls.forEach(URL.revokeObjectURL);urls=[];$('downloads').replaceChildren();
 try{
  if(mode==='bundle'){
   if(selected.length>50||selected.reduce((n,item)=>n+item.file.size,0)>28*1024*1024)throw Error('A bundle supports up to 50 designs and 28 MB total source files. Use individual ZIPs for larger batches.');
   $('status').textContent=`Packaging ${selected.length} designs into one bundle…`;
   const designs=[];for(const item of selected)designs.push({image:await imageData(item.file),title:designTitle(item,opts,selected.length)});
   downloadLink(await exportZip('/api/collection',{items:designs,options:opts}),opts.title.trim()||'Insert collection');
  }else{
   for(let i=0;i<selected.length;i++){const item=selected[i];$('status').textContent=`Packaging ${i+1} of ${selected.length}: ${item.file.name}…`;const title=designTitle(item,opts,selected.length);downloadLink(await exportZip('/api/bundle',{image:await imageData(item.file),options:{...opts,title}}),title)}
  }
  $('status').textContent=mode==='bundle'?'Your bundle ZIP is ready below.':'Your individual ZIPs are ready below.';
 }catch(e){$('status').textContent='Export failed: '+e.message}
 finally{$('files').disabled=false;$('generate').disabled=false}
};
