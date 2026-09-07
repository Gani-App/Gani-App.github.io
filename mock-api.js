
(function(){
  const seed = {
    user:{id:"demo-user",name:"GANI User",verified:true},
    notifications:[
      {id:"n1",title:"Xaqiijin diyaar ah",read:false},
      {id:"n2",title:"Dashboard-ka waa la cusbooneysiiyey",read:true}
    ],
    accounts:[
      {id:"a1",name:"Demo Account",provider:"Demo",status:"verified",mode:"demo"},
      {id:"a2",name:"Sample Marketplace Account",provider:"Sample",status:"review",mode:"demo"}
    ]
  };
  const KEY="gani.v25.mock.state";
  function load(){ try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(seed)}catch(e){return structuredClone(seed)} }
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
  window.GANI_MOCK_API={
    mode:"local-demo",
    async getProfile(){return load().user},
    async getAccounts(){return load().accounts},
    async getNotifications(){return load().notifications},
    async markNotificationRead(id){let s=load();let n=s.notifications.find(x=>x.id===id);if(n)n.read=true;save(s);return n},
    async reset(){localStorage.removeItem(KEY);return load()}
  };
})();
