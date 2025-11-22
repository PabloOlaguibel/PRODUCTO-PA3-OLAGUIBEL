class Producto {
  constructor(id, nombre, precio, categoria, stock){
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.categoria = categoria;
    this.stock = stock;
  }
  calcularImpuesto(){ 
    return this.precio * 0.12;
  }
}
class Electronico extends Producto {
  calcularImpuesto(){ 
    return this.precio * 0.18;
  }
}
class Ropa extends Producto {
  calcularImpuesto(){ 
    return this.precio * 0.08;
  }
}

Producto.prototype.formato = function(){
  return `${this.nombre} · S/${this.precio.toFixed(2)}`;
}


const productos = [
  new Electronico(1,"Laptop Ultra X1", 1299.99, "electronica", 6),
  new Electronico(2,"Auriculares Pro", 199.99, "electronica", 12),
  new Ropa(3,"Camiseta Minimal", 29.99, "ropa", 40),
  new Producto(4,"Taza Cerámica", 12.5, "hogar", 80),
  new Producto(5,"Lámpara LED", 49.9, "hogar", 18),
  new Ropa(6,"Chaqueta Outdoor", 139.5, "ropa", 8)
];


const stockPorCategoria = new Map();
for(const p of productos){
  stockPorCategoria.set(p.categoria, (stockPorCategoria.get(p.categoria) || 0) + p.stock);
}


class Carrito {
  constructor(){
    this.items = []; 
  }
  agregar(prod, qty=1){
    const existente = this.items.find(i=>i.producto.id === prod.id);
    if(existente){
      existente.cantidad += qty;
    } else {
      this.items.push({producto: prod, cantidad: qty});
    }
    this._emitChange();
  }
  eliminar(id){
    this.items = this.items.filter(i=>i.producto.id !== id);
    this._emitChange();
  }
  actualizarCantidad(id, qty){
    const it = this.items.find(i=>i.producto.id === id);
    if(it) it.cantidad = qty;
    this._emitChange();
  }
  subtotal(){
    return this.items.reduce((s,i)=> s + i.producto.precio * i.cantidad, 0);
  }
  impuestos(){
    
    return this.items.reduce((s,i)=> s + i.producto.calcularImpuesto() * i.cantidad, 0);
  }
  total(){
    return this.subtotal() + this.impuestos();
  }
  _emitChange(){
    
    document.dispatchEvent(new CustomEvent('carrito:change', {detail:this}));
  }
}
const carrito = new Carrito();


const formatMoney = (n) => `S/${n.toFixed(2)}`;


function findProductById(id){
  return productos.find(p=>p.id === Number(id));
}


function countdown(n){
  if(n<=0) return;
  document.getElementById('fecha-entrega').textContent = `Oferta termina en ${n}s`;
  setTimeout(()=> countdown(n-1), 1000); 
}


function crearAplicadorDescuento(descuento){
  return function(producto){
    producto.precio = Math.max(0, producto.precio - descuento);
  }
}


function getImagePath(productName) {
    const mapping = {
        "Laptop Ultra X1": "Laptop.png",
        "Auriculares Pro": "Auriculares.png",
        "Camiseta Minimal": "Camiseta.png",
        "Taza Cerámica": "Tazas.png",
        "Lámpara LED": "Lampara.png",
        "Chaqueta Outdoor": "Chaqueta.png"
    };
    const fileName = mapping[productName] || productName.split(' ')[0] + '.png'; 
    return `img/${fileName}`;
}



const productsEl = document.getElementById('products');
const cartEl = document.getElementById('cart');
const cartCount = document.getElementById('cart-count');
const cartItemsEl = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');

function renderProducts(list){
  productsEl.innerHTML = '';
  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'card';
    const imagePath = getImagePath(p.nombre); 
    card.innerHTML = `
      <div class="thumb">
        <img src="${imagePath}" alt="${p.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
      </div>
      <h3>${p.nombre}</h3>
      <p>${p.formato()}</p>
      <div class="meta">
        <div>
          <small>Stock: ${p.stock}</small><br>
          <small>Impuesto aprox: ${formatMoney(p.calcularImpuesto())}</small>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button class="btn-add" data-id="${p.id}">Agregar</button>
          <button class="btn-info" data-id="${p.id}">Info</button>
        </div>
      </div>
    `;
    productsEl.appendChild(card);
  });
}


document.addEventListener('click', function(ev){
  
  const add = ev.target.closest('.btn-add');
  if(add){
    const id = add.dataset.id;
    const p = findProductById(id);
    carrito.agregar(p,1);
  }
  const info = ev.target.closest('.btn-info');
  if(info){
    const id = info.dataset.id;
    const p = findProductById(id);
    
    showModal(`<h3>${p.nombre}</h3><p>Categoría: ${p.categoria}</p><p>Precio: ${formatMoney(p.precio)}</p><p>${p.formato()}</p>`);
  }
});


productsEl.addEventListener('click', function(e){
  
}, true);


document.addEventListener('carrito:change', (e)=>{
  updateCartUI(e.detail);
});


document.getElementById('btn-cart').addEventListener('click', ()=> toggleCart(true));
document.getElementById('close-cart').addEventListener('click', ()=> toggleCart(false));
document.getElementById('checkout').addEventListener('click', ()=> {
  if(carrito.items.length===0){ alert('El carrito está vacío'); return; }
  showModal('<h3>Procesando pago</h3><p>Gracias por su compra (simulación).</p>');
  carrito.items = []; carrito._emitChange();
});


cartItemsEl.addEventListener('click', (ev)=>{
  const btn = ev.target.closest('.remove-item');
  if(btn){
    const id = Number(btn.dataset.id);
    carrito.eliminar(id);
  }
});
cartItemsEl.addEventListener('input', (ev)=>{
  const input = ev.target.closest('.qty');
  if(input){
    const id = Number(input.dataset.id);
    const qty = Number(input.value) || 1;
    carrito.actualizarCantidad(id, qty);
  }
});


function updateCartUI(car){
  cartCount.textContent = car.items.reduce((s,i)=> s + i.cantidad, 0);
  cartItemsEl.innerHTML = '';
  car.items.forEach(i=>{
    const div = document.createElement('div');
    div.className = 'cart-item';
    const imagePath = getImagePath(i.producto.nombre);
    div.innerHTML = `
      <div class="mini">
        <img src="${imagePath}" alt="${i.producto.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;">
      </div>
      <div style="flex:1">
        <div style="font-weight:600">${i.producto.nombre}</div>
        <div style="font-size:13px;color:#9aa4b2">${formatMoney(i.producto.precio)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <input class="qty" data-id="${i.producto.id}" type="number" min="1" value="${i.cantidad}" style="width:64px;padding:6px;border-radius:6px"/>
        <button class="remove-item" data-id="${i.producto.id}">Eliminar</button>
      </div>
    `;
    cartItemsEl.appendChild(div);
  });
  
  subtotalEl.textContent = formatMoney(car.subtotal());
  taxEl.textContent = formatMoney(car.impuestos());
  totalEl.textContent = formatMoney(car.total());
}


function showModal(html){
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = html;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
document.getElementById('modal-close').addEventListener('click', ()=> {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
});


document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase();
  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
  renderProducts(filtered);
});

document.getElementById('filter-category').addEventListener('change', (e)=>{
  const v = e.target.value;
  const filtered = v === 'all' ? productos : productos.filter(p=>p.categoria===v);
  renderProducts(filtered);
});

document.getElementById('sort').addEventListener('change', (e)=>{
  const v = e.target.value;
  let arr = [...productos];
  if(v==='price-asc') arr.sort((a,b)=>a.precio-b.precio);
  if(v==='price-desc') arr.sort((a,b)=>b.precio-a.precio);
  renderProducts(arr);
});


const aplicarDescuento5 = crearAplicadorDescuento(5);
document.getElementById('offer-btn').addEventListener('click', ()=>{
  productos.forEach(p=>aplicarDescuento5(p));
  renderProducts(productos);
  countdown(8);
});


function toggleCart(open){
  if(open) cartEl.classList.add('open'); else cartEl.classList.remove('open');
}


renderProducts(productos);
document.getElementById('fecha-entrega').textContent = new Date().toLocaleDateString();
countdown(0);


console.log('Stock por categoría:', Array.from(stockPorCategoria.entries()));