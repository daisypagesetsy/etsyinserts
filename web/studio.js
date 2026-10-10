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

function palette(){return Object.fromEntries(['background','accent','text'].map(key=>[key,$('theme-'+key).value]))}
for(const key of ['background','accent','text'])$('theme-'+key).oninput=()=>{document.documentElement.style.setProperty('--brand-'+key,$('theme-'+key).value)};
$('theme-reference').onchange=async()=>{const file=$('theme-reference').files[0];if(!file)return;if(file.size>150*1024*1024){$('theme-status').textContent='Reference ZIP must be below 150 MB.';return}const input=$('theme-reference');input.disabled=true;$('theme-status').textContent='Reading your banner…';try{const response=await fetch('/api/theme',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});const data=await response.json();if(!response.ok)throw Error(data.error);for(const key of ['background','accent','text']){$('theme-'+key).value=data.palette[key];document.documentElement.style.setProperty('--brand-'+key,data.palette[key])}$('brand-banner').src='data:image/png;base64,'+data.banner;$('brand-banner').hidden=false;$('theme-status').textContent=data.source+' · '+data.note}catch(error){$('theme-status').textContent=error.message}finally{input.disabled=false}};
function decodedBlob(value,type){const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new Blob([bytes],{type})}
async function copyText(text,button){try{await navigator.clipboard.writeText(text);button.textContent='Copied ✓'}catch{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();button.textContent=ok?'Copied ✓':'Select the text to copy'}setTimeout(()=>{button.textContent='Copy'},1800)}
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
async function populateAssets(result,opts,ai){
 result.assets.replaceChildren();result.status.textContent=ai.mode==='ai'?'AI is reviewing this artwork…':'Preparing basic copy and listing assets…';
 try{
  const response=await fetch('/api/seller-assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:await imageData(result.item.file),options:{...opts,title:result.title},mode:ai.mode,provider:ai.provider,ai_key:ai.key})});
  const data=await response.json();if(!response.ok)throw Error(data.error);
  result.status.textContent=data.copy_error?data.source+': '+data.copy_error:data.source+' · review before publishing';
  if(data.copy)for(const [name,label] of [['title','Etsy title'],['description','Description'],['tags','Tags'],['alt_text','Artwork preview alt text'],['caption','Social caption']]){
   const field=document.createElement('div');field.className='copy-field';const top=document.createElement('div');top.className='copy-label';const caption=document.createElement('label');caption.textContent=label;
   const text=document.createElement('textarea');text.value=name==='tags'?data.copy.tags.join(', '):data.copy[name];text.rows=name==='description'?10:2;text.setAttribute('aria-label',label+' for '+result.title);
   const button=document.createElement('button');button.type='button';button.textContent='Copy';button.onclick=()=>copyText(text.value,button);top.append(caption,button);field.append(top,text);result.assets.append(field);
  }
  const note=document.createElement('p');note.className='hint';note.textContent='Canva: upload the PowerPoint below. Text and artwork are separate objects; artwork itself remains a flattened image. Check fonts/layout after import. This is not a Canva template link. Downloads contain the generated drafts; edits made in these text boxes are for copying.';result.assets.append(note);
  const links=document.createElement('div');links.className='asset-links';result.assets.append(links);
  downloadLink(decodedBlob(data.seller_zip,'application/zip'),result.title+' seller assets',links);
  downloadLink(decodedBlob(data.canva_pptx,'application/vnd.openxmlformats-officedocument.presentationml.presentation'),result.title+' Canva editable',links,'pptx');
  const gallery=document.createElement('div');gallery.className='listing-gallery';
  for(const image of data.listing_images){const blob=decodedBlob(image.data,'image/png');const tile=document.createElement('div');const img=document.createElement('img');const url=URL.createObjectURL(blob);urls.push(url);img.src=url;img.alt=image.name+' for '+result.title;tile.append(img);downloadLink(blob,result.title+' '+image.name.replace('.png',''),tile,'png');gallery.append(tile)}result.assets.append(gallery);
 }catch(error){result.status.textContent='Seller assets need attention: '+error.message;}
 const retry=document.createElement('button');retry.type='button';retry.className='retry-assets';retry.textContent='Regenerate seller assets';retry.onclick=async()=>{retry.disabled=true;await populateAssets(result,opts,{mode:$('copy-mode').value,provider:$('ai-provider').value,key:$('ai-key').value})};result.assets.append(retry);
}
$('generate').onclick=async()=>{
 const opts={...options(),palette:palette()},selected=[...items],mode=$('package').value,ai={mode:$('copy-mode').value,provider:$('ai-provider').value,key:$('ai-key').value};
 if(mode==='bundle'&&(selected.length>50||selected.reduce((n,item)=>n+item.file.size,0)>28*1024*1024)){$('status').textContent='A bundle supports up to 50 designs and 28 MB total source files. Use individual ZIPs for larger batches.';return}
 busy=true;update();const controls=[...document.querySelectorAll('.editor input,.editor select')];controls.forEach(control=>control.disabled=true);
 urls.forEach(URL.revokeObjectURL);urls=[];$('downloads').replaceChildren();$('result-cards').replaceChildren();
 const results=selected.map((item,i)=>resultCard(item,designTitle(item,opts,selected.length),i));
 try{
  if(mode==='bundle'){
   $('status').textContent=`Packaging ${selected.length} designs into one bundle…`;
   const designs=[];for(const result of results)designs.push({image:await imageData(result.item.file),title:result.title});
   downloadLink(await exportZip('/api/collection',{items:designs,options:opts}),opts.title.trim()||'Insert collection');
  }else{
   for(let i=0;i<results.length;i++){const result=results[i];$('status').textContent=`Packaging ${i+1} of ${results.length}: ${result.item.file.name}…`;downloadLink(await exportZip('/api/bundle',{image:await imageData(result.item.file),options:{...opts,title:result.title}}),result.title,result.customer)}
  }
  for(let i=0;i<results.length;i++){$('status').textContent=`Preparing seller assets ${i+1} of ${results.length}…`;await populateAssets(results[i],opts,ai)}
  $('status').textContent='Customer ZIPs are ready. Find each design’s shop copy and seller assets below; check any AI connection messages.';
 }catch(e){$('status').textContent='Export failed: '+e.message;for(const result of results)if(result.status.textContent==='Customer ZIP pending…')result.status.textContent='Export did not finish. Retry after resolving the error.'}
 finally{controls.forEach(control=>control.disabled=false);busy=false;$('generate').disabled=false}
};
