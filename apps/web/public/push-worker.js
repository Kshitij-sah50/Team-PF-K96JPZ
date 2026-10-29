self.addEventListener("push", event => {
  let data;try{data=event.data?.json();}catch{return;}
  if(!data||typeof data.title!=="string")return;
  const url=typeof data.url==="string"&&data.url.startsWith("/")&&!data.url.startsWith("//")?data.url:"/";
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag,data:{url}}));
});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil((async()=>{const url=new URL(event.notification.data?.url||"/",self.location.origin).href;const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});for(const client of windows){if(client.url===url)return client.focus();}return self.clients.openWindow(url);})());});
