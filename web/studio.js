const $=id=>document.getElementById(id);let models=[],items=[],active=0,urls=[],busy=false;
fetch('/models.json').then(r=>r.json()).then(data=>{models=data;for(const brand of [...new Set(data.map(m=>m.brand))]){let g=document.createElement('optgroup');g.label=brand;data.forEach((m,i)=>{if(m.brand===brand)g.append(new Option(m.name.replace(/ \(.*?\)/g,''),i))});$('model').append(g)}$('model').value='0'}).catch(()=>{$('status').textContent='Unable to load models. Custom measured sizing is still available.'});
function options(){const opts=Object.fromEntries(['title','shop','width','height','radius','fit'].map(id=>[id,$(id).value]));for(const id of ['width','height','radius'])opts[id]=Number(opts[id])*10;return opts}
function update(){const w=+$('width').value*10,h=+$('height').value*10,r=+$('radius').value*10;let valid=w>=30&&w<=400&&h>=30&&h<=400&&r>=0&&r<=Math.min(30,w/2,h/2);$('generate').disabled=busy||!items.length||!valid;if(valid){$('insert').style.aspectRatio=w+'/'+h;$('insert').style.borderRadius=(r/w*240)+'px'}$('preview').style.objectFit=$('fit').value;let item=items[active];if(item&&valid){const dpi=($('fit').value==='cover'?Math.min:Math.max)(item.width/(w/25.4),item.height/(h/25.4));$('quality').textContent=Math.round(dpi)+' DPI at this print size';$('qualitydetail').textContent=`${item.width} × ${item.height} pixels · ${dpi>=300?'Meets the 300 DPI print target.':'Below 300 DPI. A larger original will give finer detail.'}`;}if(items.length)$('status').textContent=!valid?'Enter valid case dimensions and radius.':`${items.length} design${items.length>1?'s':''} ready. ${$('package').value==='bundle'?'One bundle ZIP.':'Each gets its own ZIP.'}`}
function show(i){active=i;$('preview').src=items[i].url;$('preview').style.display='block';$('placeholder').style.display='none';update()}
$('files').onchange=async()=>{items.forEach(i=>URL.revokeObjectURL(i.url));items=[];$('queue').replaceChildren();for(const file of $('files').files){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>28*1024*1024){$('status').textContent='Use PNG, JPEG or WebP files below 28 MB each.';continue}try{const url=URL.createObjectURL(file),img=new Image();img.src=url;await img.decode();items.push({file,url,width:img.naturalWidth,height:img.naturalHeight});let b=document.createElement('button');const index=items.length-1;b.textContent=file.name;b.onclick=()=>show(index);$('queue').append(b)}catch{$('status').textContent='An image could not be opened.'}}if(items.length)show(0);else{$('preview').style.display='none';$('placeholder').style.display='grid';update()}};
$('model').onchange=()=>{const m=models[$('model').value];if(!m?.w)$('advanced').open=true;$('width').value=m?Number((m.w/10).toFixed(3)):'';$('height').value=m?Number((m.h/10).toFixed(3)):'';$('modelnote').textContent=m?.w?'Sample device body dimensions. Measure your case; preset fit is not verified.':'Enter your measured case width and height in centimeters.';update()};for(const id of ['width','height','radius','fit'])$(id).oninput=update;
function imageData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)})}
function designTitle(item,opts,count){const filename=item.file.name.replace(/\.[^.]+$/,'');return opts.title.trim()?(count>1?opts.title+' · '+filename:opts.title):filename}
function downloadLink(blob,title,target=$('downloads'),extension='zip'){const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=(title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'insert')+'.'+extension;a.textContent='↓ Download '+title+` (${(blob.size/1048576).toFixed(1)} MB)`;target.append(a)}
async function exportZip(route,payload){const response=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok)throw Error((await response.json()).error);return response.blob()}
$('package').onchange=update;

async function copyText(text,button){const label=button.textContent;try{await navigator.clipboard.writeText(text);button.textContent='Copied ✓'}catch{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();button.textContent=ok?'Copied ✓':'Select the text to copy'}setTimeout(()=>{button.textContent=label},1800)}
function resultCard(item,title,index){
 const card=document.createElement('article');card.className='result-card';
 const header=document.createElement('div');header.className='result-header';
 const preview=document.createElement('img');preview.src=item.url;preview.alt='Artwork preview for '+title;
 const heading=document.createElement('h3');heading.textContent=String(index+1).padStart(2,'0')+' / '+title;header.append(preview,heading);
 const status=document.createElement('p');status.className='asset-status';status.textContent='Customer ZIP pending…';
 const customer=document.createElement('div');customer.className='asset-links';
 const assets=document.createElement('div');assets.className='seller-assets';card.append(header,status,customer,assets);$('result-cards').append(card);
 return {card,status,customer,assets,item,title};
}
function listingText(copy){return `TITLE
${copy.title}

TAGS
${copy.tags}

DESCRIPTION
${copy.description}
`}
async function populateListing(result,opts){
 result.assets.replaceChildren();result.status.textContent='Preparing your listing copy…';
 try{
  const response=await fetch('/api/listing-copy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({options:{...opts,title:result.title},package:result.designs?'bundle':'individual',designs:result.designs})});
  const data=await response.json();if(!response.ok)throw Error(data.error);
  result.status.textContent=data.source;const fields={};
  for(const [name,label] of [['title','Title'],['tags','Tags · 13 phrases'],['description','Description']]){
   const field=document.createElement('div');field.className='copy-field';const top=document.createElement('div');top.className='copy-label';const caption=document.createElement('label');caption.textContent=label;
   const text=document.createElement('textarea');text.value=name==='tags'?data.tags.join(', '):data[name];text.rows=name==='description'?15:2;text.setAttribute('aria-label',label+' for '+result.title);fields[name]=text;
   const button=document.createElement('button');button.type='button';button.textContent='Copy';button.onclick=()=>copyText(text.value,button);top.append(caption,button);field.append(top,text);result.assets.append(field);
  }
  const actions=document.createElement('div');actions.className='asset-links';
  const all=document.createElement('button');all.type='button';all.textContent='Copy all';
  const current=()=>Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value]));all.onclick=()=>copyText(listingText(current()),all);
  const download=document.createElement('button');download.type='button';download.textContent='Download listing TXT';download.onclick=()=>{const url=URL.createObjectURL(new Blob([listingText(current())],{type:'text/plain;charset=utf-8'}));urls.push(url);const a=document.createElement('a');a.href=url;a.download=(result.title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'insert')+'-listing.txt';a.click()};
  actions.append(all,download);result.assets.append(actions);
 }catch(error){result.status.textContent='Could not prepare listing copy: '+error.message;}
}
async function populateMockups(result,selected,opts){
 const gallery=document.createElement('div');gallery.className='mockup-gallery';result.customer.after(gallery);
 for(const item of selected){
  const tile=document.createElement('div');tile.className='mockup-tile';const status=document.createElement('p');status.textContent='Creating watermarked post image…';tile.append(status);gallery.append(tile);
  try{const response=await fetch('/api/mockup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:await imageData(item.file),options:opts})});if(!response.ok)throw Error((await response.json()).error);const blob=await response.blob(),url=URL.createObjectURL(blob);urls.push(url);const image=document.createElement('img');image.src=url;image.alt='Watermarked hand-held reader mockup for '+item.file.name;status.textContent=item.file.name.replace(/\.[^.]+$/,'');tile.append(image);downloadLink(blob,status.textContent+' post image',tile,'png')}
  catch(error){status.textContent='Post image unavailable: '+error.message}
 }
}
$('generate').onclick=async()=>{
 const opts=options(),selected=[...items],mode=$('package').value;
 if(mode==='bundle'&&(selected.length>50||selected.reduce((n,item)=>n+item.file.size,0)>28*1024*1024)){$('status').textContent='A bundle supports up to 50 designs and 28 MB total source files. Use individual ZIPs for larger batches.';return}
 busy=true;update();const controls=[...document.querySelectorAll('.editor input,.editor select')];controls.forEach(control=>control.disabled=true);
 urls.forEach(URL.revokeObjectURL);urls=[];$('downloads').replaceChildren();$('result-cards').replaceChildren();
 const results=mode==='bundle'?[resultCard(selected[0],opts.title.trim()||'Bookish Insert Collection',0)]:selected.map((item,i)=>resultCard(item,designTitle(item,opts,selected.length),i));
 if(mode==='bundle'){results[0].designs=selected.map(item=>item.file.name.replace(/\.[^.]+$/,''));const gallery=document.createElement('div');gallery.className='bundle-previews';for(const item of selected){const img=document.createElement('img');img.src=item.url;img.alt=item.file.name;gallery.append(img)}results[0].card.querySelector('.result-header').after(gallery)}
 try{
  if(mode==='bundle'){
   $('status').textContent=`Packaging ${selected.length} designs into one bundle…`;
   const designs=[];for(const item of selected)designs.push({image:await imageData(item.file),title:designTitle(item,opts,selected.length)});
   downloadLink(await exportZip('/api/collection',{items:designs,options:opts}),results[0].title,results[0].customer);
  }else{
   for(let i=0;i<results.length;i++){const result=results[i];$('status').textContent=`Packaging ${i+1} of ${results.length}: ${result.item.file.name}…`;downloadLink(await exportZip('/api/bundle',{image:await imageData(result.item.file),options:{...opts,title:result.title}}),result.title,result.customer)}
  }
  for(let i=0;i<results.length;i++){$('status').textContent=`Preparing listing copy ${i+1} of ${results.length}…`;await populateListing(results[i],opts);await populateMockups(results[i],mode==='bundle'?selected:[results[i].item],opts)}
  $('status').textContent='Done. Your ZIPs, listing copy and watermarked post images are ready below. Review the copy before posting.';
 }catch(e){$('status').textContent='Export failed: '+e.message;for(const result of results)if(result.status.textContent==='Customer ZIP pending…')result.status.textContent='Export did not finish. Retry after resolving the error.'}
 finally{controls.forEach(control=>control.disabled=false);busy=false;$('generate').disabled=false}
};
