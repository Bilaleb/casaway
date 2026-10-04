
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import './App.css'

const photo = (name) => `/images/${encodeURIComponent(name)}`
const money = (amount) => `${Number(amount || 0).toLocaleString('fr-MA')} MAD`
const variantFamily = (name = '') => name.toLowerCase().replace(/^(atlas|jawhara|sahara)\s+/, '').replace(/^hand-finished leather\s+/, '')
const swatchColor = (color = '') => {
  const value = color.toLowerCase()
  if (/bordeaux|burgundy|garnet/.test(value)) return '#702039'
  if (/emerald|green|forest/.test(value)) return '#356451'
  if (/navy|cobalt|blue/.test(value)) return '#405f8c'
  if (/black/.test(value)) return '#302b2a'
  if (/silver/.test(value)) return '#b5b8b9'
  if (/khaki/.test(value)) return '#858460'
  if (/gold|ochre/.test(value)) return '#c49b4a'
  return '#e6dcc9'
}
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Request could not be completed')
  return response.json()
}

function AppFrame() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('libassi-cart') || '[]'))
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('libassi-theme') || 'light')

  useEffect(() => {
    api('/products').then((items) => { if (Array.isArray(items)) setProducts(items) }).catch(() => {})
  }, [])
  useEffect(() => localStorage.setItem('libassi-cart', JSON.stringify(cart)), [cart])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('libassi-theme', theme)
  }, [theme])

  const addToCart = (product, size) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id && item.size === size)
      return existing
        ? items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { id: product.id, name: product.name, image_url: product.image_url, size, color: product.color, price_mad: product.price_mad, quantity: 1 }]
    })
    setNotice('Added to your bag')
    window.setTimeout(() => setNotice(''), 2200)
    setCartOpen(true)
  }

  const updateQuantity = (id, size, amount) => setCart((items) => items.map((item) => item.id === id && item.size === size ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item).filter((item) => item.quantity > 0))
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  return <>
    <header className="site-header">
      <button className="menu-toggle" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
      <Link to="/" className="wordmark" onClick={() => setMenuOpen(false)}>LIBASSI<span>MADE OF MOROCCO</span></Link>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
        <Link to="/category/men" onClick={() => setMenuOpen(false)}>Men</Link>
        <Link to="/category/women" onClick={() => setMenuOpen(false)}>Women</Link>
        <Link to="/category/accessories" onClick={() => setMenuOpen(false)}>Accessories</Link>
        <a href="/#story" onClick={() => setMenuOpen(false)}>Our story</a>
        <a href="/#contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <div className="header-actions"><Link className="admin-link" to="/admin">Admin</Link><button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={theme === 'dark'}>{theme === 'dark' ? 'Light' : 'Dark'}</button><button className="bag-button" onClick={() => setCartOpen(true)}>Bag <span>{cartCount}</span></button></div>
    </header>
    <Routes>
      <Route path="/" element={<Home products={products} addToCart={addToCart} />} />
      <Route path="/category/:category" element={<CategoryPage products={products} addToCart={addToCart} />} />
      <Route path="/product/:id" element={<ProductPage products={products} addToCart={addToCart} />} />
      <Route path="/checkout/stripe-return" element={<StripeReturnPage clearCart={setCart} />} />
      <Route path="/admin" element={<AdminPage products={products} setProducts={setProducts} />} />
      <Route path="*" element={<Home products={products} addToCart={addToCart} />} />
    </Routes>
    <Footer />
    {cartOpen && <CartDrawer cart={cart} updateQuantity={updateQuantity} close={() => setCartOpen(false)} clear={() => setCart([])} />}
    {notice && <div className="notice" role="status">{notice}</div>}
  </>
}

function ProductCard({ product, index = 0 }) {
  return <article className="product-card" style={{ '--card-index': index }}>
    <Link to={`/product/${product.id}`} className="product-image-wrap"><img src={product.image_url} alt={product.name} loading="lazy" />
      {product.is_bestseller && <span className="product-flag">Bestseller</span>}
      <span className="quick-add">View piece <span aria-hidden="true">↗</span></span>
    </Link>
    <div className="product-meta"><div><p className="product-color">{product.color || 'Artisan finish'}</p><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link></div><span className="product-price">{money(product.price_mad)}</span></div>
  </article>
}

function Home({ products }) {
  const womenPieces = products.filter((item) => item.category === 'women').slice(0, 4)
  const menPieces = products.filter((item) => item.category === 'men').slice(0, 4)
  const accessories = products.filter((item) => item.category === 'accesories').slice(0, 4)
  const collectionGrid = (items, category) => items.length
    ? <div className="product-grid">{items.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
    : <p className="empty-state">The {category} collection is being prepared.</p>
  return <main>
    <section className="hero">
      <img className="hero-photo" src={photo('summer-spring-2026.jpg')} alt="A Libassi look in rich bordeaux silk, photographed in the old medina" />
      <div className="hero-shade" />
      <div className="hero-copy"><p className="eyebrow">A wardrobe woven with heritage</p><h1>Discover Moroccan style <i>&</i> cultural heritage.</h1><p className="hero-intro">Pieces made to be lived in, remembered, and passed on. Meet a new expression of traditional Moroccan dress.</p><Link className="button button-light" to="/category/women">Shop the collection <span aria-hidden="true">↗</span></Link></div>
      <div className="hero-caption"><span>01 / 03</span><span>THE SPRING EDITION</span><span>CASABLANCA, MOROCCO</span></div>
      <span className="hero-seal">Crafted<br />in Morocco</span>
    </section>
    <section className="value-strip" aria-label="Our commitments"><div><span className="value-number">01</span><p>100% authentic<br /><b>Moroccan craft</b></p></div><div><span className="value-number">02</span><p>Easy, secure<br /><b>cash on delivery</b></p></div><div><span className="value-number">03</span><p>Artisanal hand-finished<br /><b>sfifa embroidery</b></p></div></section>
    <section className="collection section-pad"><div className="section-heading"><div><p className="eyebrow">The womenswear edit</p><h2>Made for <i>her.</i></h2></div><Link to="/category/women" className="text-link">Shop women <span aria-hidden="true">↗</span></Link></div>{collectionGrid(womenPieces, 'women')}</section>
    <section className="story-band" id="story"><div className="story-image"><img src={photo('djellaba sunlit.jpg')} alt="Traditional Moroccan dress in a soft, sunlit studio" loading="lazy" /></div><div className="story-copy"><p className="eyebrow">From our home to yours</p><h2>Moroccan by nature.<br /><i>Made for now.</i></h2><p>Libassi celebrates the hands, rituals, and distinctive beauty behind Moroccan dress. We bring the detail of occasionwear into pieces that feel entirely your own.</p><a href="/#contact" className="text-link">Get to know us <span aria-hidden="true">↗</span></a><span className="story-mark">L</span></div></section>
    <section className="bestsellers section-pad"><div className="section-heading"><div><p className="eyebrow">The menswear edit</p><h2>Made for <i>him.</i></h2></div><Link to="/category/men" className="text-link">Shop men <span aria-hidden="true">↗</span></Link></div>{collectionGrid(menPieces, 'men')}</section>
    <section className="collection section-pad"><div className="section-heading"><div><p className="eyebrow">Finishing touches</p><h2>Moroccan <i>accessories.</i></h2></div><Link to="/category/accessories" className="text-link">Shop accessories <span aria-hidden="true">↗</span></Link></div>{collectionGrid(accessories, 'accessories')}</section>
    <section className="testimonial"><p className="eyebrow">Notes from our community</p><blockquote>“The embroidery is even more beautiful in person. I wore my gandoura for Eid and felt completely myself.”</blockquote><p className="review-credit">SALMA R. <span>CASABLANCA, MOROCCO</span></p><div className="review-dots"><span /><span /><span /></div></section>
    <section className="social-band"><div><p className="eyebrow">A little everyday inspiration</p><h2>In good <i>company.</i></h2><p>Wear it your way. Tag <b>#LibassiStyle</b></p></div><div className="social-photos">{['Juny takchita..jpg', 'moroccan-gandoura-jawhara-bordeaux-broderie-blanche.jpg', 'Black-and-Bronze-diamond-Patterned-kaftan.jpg'].map((image, index) => <img key={image} src={photo(image)} alt={`Libassi womenswear look ${index + 1}`} loading="lazy" />)}</div></section>
    <section id="contact" className="contact-band"><span>Need a hand choosing?</span><a href="mailto:hello@libassi.ma">We would love to help <span aria-hidden="true">↗</span></a><span>CASABLANCA · MOROCCO</span></section>
  </main>
}

function CategoryPage({ products }) {
  const { category } = useParams()
  const productCategory = category === 'accessories' ? 'accesories' : category
  const [sort, setSort] = useState('featured')
  const [colorFilter, setColorFilter] = useState('all')
  const filtered = useMemo(() => {
    let items = products.filter((product) => product.category === productCategory)
    if (colorFilter !== 'all') items = items.filter((product) => product.color?.toLowerCase().includes(colorFilter))
    if (sort === 'low') items = [...items].sort((a, b) => a.price_mad - b.price_mad)
    if (sort === 'high') items = [...items].sort((a, b) => b.price_mad - a.price_mad)
    return items
  }, [products, productCategory, sort, colorFilter])
  const title = productCategory === 'men' ? 'For him' : productCategory === 'women' ? 'For her' : 'Finishing touches'
  return <main className="catalog-page"><div className="catalog-intro"><p className="eyebrow">The Libassi collection</p><h1>{title}<i>.</i></h1><p>Considered pieces, made with Moroccan tradition at heart.</p></div><div className="catalog-toolbar"><span>{filtered.length} pieces</span><div><label>Colour <select value={colorFilter} onChange={(event) => setColorFilter(event.target.value)}><option value="all">All colours</option><option value="ivory">Ivory</option><option value="green">Green</option><option value="gold">Gold</option><option value="black">Black</option></select></label><label>Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div></div><div className="product-grid">{filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>{!filtered.length && <p className="empty-state">No pieces found in this selection.</p>}</main>
}

function ProductPage({ products, addToCart }) {
  const { id } = useParams()
  const product = products.find((item) => String(item.id) === id)
  const [size, setSize] = useState('')
  const [error, setError] = useState('')
  if (!product) return <main className="empty-state product-missing">This piece could not be found. <Link to="/category/women">Explore the collection</Link></main>
  const sizes = product.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL', '2XL']
  const variants = products.filter((item) => variantFamily(item.name) === variantFamily(product.name) && item.category === product.category)
  return <main className="product-detail"><div className="detail-image"><img src={product.image_url} alt={product.name} /></div><div className="detail-copy"><p className="eyebrow">{product.category === 'men' ? 'The menswear edit' : product.category === 'women' ? 'The womenswear edit' : 'Moroccan accessories'}</p><h1>{product.name}</h1><p className="detail-price">{money(product.price_mad)}</p><p className="detail-description">{product.description}</p><div className="detail-option"><p>Colour <span>{product.color}</span></p><div className="variant-options">{variants.map((variant) => <Link key={variant.id} to={`/product/${variant.id}`} className={variant.id === product.id ? 'variant-chip is-selected' : 'variant-chip'} aria-label={`Colour ${variant.color}`} aria-current={variant.id === product.id ? 'page' : undefined}><i style={{ '--swatch-color': swatchColor(variant.color) }} />{variant.color}</Link>)}</div></div><div className="detail-option"><p>Choose your size <span>Size guide</span></p><div className="size-options">{sizes.map((item) => <button key={item} className={size === item ? 'is-selected' : ''} onClick={() => { setSize(item); setError('') }}>{item}</button>)}</div>{error && <p className="field-error">{error}</p>}</div><button className="button button-burgundy add-button" onClick={() => size ? addToCart(product, size) : setError('Please choose a size to continue')}>Add to bag <span>{money(product.price_mad)}</span></button><div className="delivery-note"><span>COD</span><p>Pay on delivery, anywhere in Morocco.<br />Complimentary nationwide shipping.</p></div><details className="product-accord"><summary>Details & craftsmanship</summary><p>{product.description} Each piece is selected for its finish, comfort, and enduring connection to Moroccan craft.</p></details></div></main>
}

function CartDrawer({ cart, updateQuantity, close, clear }) {
  const [form, setForm] = useState({ customer_name: '', phone_number: '', city: '', delivery_address: '' })
  const [order, setOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const total = cart.reduce((sum, item) => sum + item.price_mad * item.quantity, 0)
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submitOrder = async (event) => {
    event.preventDefault()
    if (!cart.length) return
    setSubmitting(true)
    setError('')
    const payload = { ...form, total_amount_mad: total, items: cart.map((item) => ({ product_id: item.id, product_name: item.name, size: item.size, color: item.color, price_mad: item.price_mad, quantity: item.quantity })) }
    try {
      if (paymentMethod === 'Stripe') {
        const checkout = await api('/orders/stripe-checkout', { method: 'POST', body: JSON.stringify(payload) })
        window.location.assign(checkout.checkout_url)
        return
      }
      const saved = await api('/orders', { method: 'POST', body: JSON.stringify(payload) })
      setOrder(saved)
      clear()
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? 'The order service is unavailable. Please try again shortly.' : requestError.message)
    } finally { setSubmitting(false) }
  }
  const whatsAppText = order ? `Salam, I have placed order ${order._id || ''} for ${money(total)}. Name: ${form.customer_name}. City: ${form.city}.` : ''
  return <div className="drawer-scrim" onClick={(event) => event.target === event.currentTarget && close()}><aside className="cart-drawer" aria-label="Shopping bag"><div className="drawer-head"><div><p className="eyebrow">LIBASSI · CASABLANCA</p><h2>{order ? 'Order received' : 'Your bag'}</h2></div><button className="icon-close" onClick={close} aria-label="Close bag">×</button></div>
    {order ? <div className="order-success"><span className="success-mark">L</span><h3>Shukran, {form.customer_name.split(' ')[0]}.</h3><p>Your order is with us. Confirm the details with our team on WhatsApp and we will be in touch.</p><a className="button button-burgundy" href={`https://wa.me/?text=${encodeURIComponent(whatsAppText)}`} target="_blank" rel="noreferrer">Confirm on WhatsApp ↗</a><p className="order-reference">ORDER {String(order._id || 'LIBASSI').slice(-8).toUpperCase()}</p></div> : <>
      <div className="cart-items">{cart.length ? cart.map((item) => <div className="cart-item" key={`${item.id}-${item.size}`}><img src={item.image_url} alt="" /><div className="cart-item-copy"><p>{item.name}</p><span>{item.color} · Size {item.size}</span><b>{money(item.price_mad)}</b><div className="quantity-control"><button onClick={() => updateQuantity(item.id, item.size, -1)} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.size, 1)} aria-label="Increase quantity">+</button></div></div></div>) : <div className="cart-empty"><span>01</span><h3>Your bag is waiting.</h3><p>Discover a piece to make your own.</p><Link to="/category/women" onClick={close}>Explore the collection ↗</Link></div>}</div>
      {cart.length > 0 && <><div className="shipping-note">Complimentary delivery throughout Morocco</div><form className="checkout-form" onSubmit={submitOrder}><div className="checkout-total"><span>Total · MAD</span><b>{money(total)}</b></div><p className="checkout-label">Delivery details</p><input aria-label="Full name" name="customer_name" placeholder="Full name" value={form.customer_name} onChange={change} required /><input aria-label="Phone number" name="phone_number" placeholder="Phone number" type="tel" value={form.phone_number} onChange={change} required /><input aria-label="City" name="city" placeholder="City" value={form.city} onChange={change} required /><textarea aria-label="Delivery address" name="delivery_address" placeholder="Delivery address" value={form.delivery_address} onChange={change} required rows="2" /><fieldset className="payment-options"><legend>Payment method</legend><label><input type="radio" name="payment_method" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={() => setPaymentMethod('Cash on Delivery')} /><span>Cash on delivery</span></label><label><input type="radio" name="payment_method" value="Stripe" checked={paymentMethod === 'Stripe'} onChange={() => setPaymentMethod('Stripe')} /><span>Card with Stripe</span></label></fieldset>{error && <p className="field-error">{error}</p>}<button className="button button-burgundy checkout-button" disabled={submitting}>{submitting ? paymentMethod === 'Stripe' ? 'Opening secure checkout...' : 'Placing your order...' : paymentMethod === 'Stripe' ? 'Continue to secure payment' : 'Place your order'} <span>↗</span></button><p className="checkout-legal">By placing your order, you agree to be contacted to confirm delivery.</p></form></>}
    </>}</aside></div>
}

function StripeReturnPage({ clearCart }) {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!sessionId) return
    api(`/orders/stripe-session/${encodeURIComponent(sessionId)}`).then((payment) => {
      setResult(payment)
      if (payment.payment_status === 'Paid') clearCart([])
    }).catch((requestError) => setError(requestError.message))
  }, [sessionId, clearCart])
  const whatsapp = result ? `Salam, I paid for Libassi order ${result.order_id}.` : ''
  return <main className="payment-result"><p className="eyebrow">LIBASSI · SECURE CHECKOUT</p><h1>{result?.payment_status === 'Paid' ? 'Payment received.' : error ? 'Payment needs attention.' : 'Confirming your payment.'}</h1>{result?.payment_status === 'Paid' ? <><p>Your payment of {money(result.total_amount_mad)} has been confirmed.</p><a className="button button-burgundy" href={`https://wa.me/?text=${encodeURIComponent(whatsapp)}`} target="_blank" rel="noreferrer">Confirm your order on WhatsApp ↗</a></> : <p>{error || 'Please wait while we confirm your secure checkout.'}</p>}<Link className="text-link" to="/">Return to the collection</Link></main>
}

function AdminPage({ products, setProducts }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [authorized, setAuthorized] = useState(false)
  const emptyProduct = { name: '', category: 'women', color: '', price_mad: '', description: '', image_url: '', sizes: ['S', 'M', 'L', 'XL', '2XL'], is_featured: false, is_bestseller: false }
  const [draft, setDraft] = useState(emptyProduct)
  const adminApi = (path, options = {}) => api(path, options)
  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [orderItems, productItems] = await Promise.all([api('/orders'), api('/products')])
      setOrders(orderItems)
      if (productItems.length) setProducts(productItems)
      setAuthorized(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally { setLoading(false) }
  }
  useEffect(() => {
    api('/admin/session').then((session) => { if (session.authenticated) loadDashboard() }).catch(() => {})
  }, [])
  const loadAdmin = async () => {
    setLoading(true)
    setError('')
    try {
      await api('/admin/login', { method: 'POST', body: JSON.stringify(credentials) })
      await loadDashboard()
    } catch (requestError) {
      setAuthorized(false)
      setError(requestError.message)
      setLoading(false)
    }
  }
  const revenue = orders.filter((order) => order.status !== 'Pending' && (order.payment_method === 'Cash on Delivery' || order.payment_status === 'Paid')).reduce((sum, order) => sum + order.total_amount_mad, 0)
  const editProduct = (product) => { setEditing(product.id); setDraft({ ...emptyProduct, ...product }) }
  const saveProduct = async (event) => {
    event.preventDefault()
    try {
      const saved = await adminApi(editing ? `/products/${editing}` : '/products', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, price_mad: Number(draft.price_mad) }) })
      setProducts((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items])
      setEditing(null); setDraft(emptyProduct); setError('')
    } catch (requestError) { setError(requestError.message) }
  }
  const removeProduct = async (product) => {
    if (!window.confirm(`Remove ${product.name}?`)) return
    try { await adminApi(`/products/${product.id}`, { method: 'DELETE' }); setProducts((items) => items.filter((item) => item.id !== product.id)) } catch (requestError) { setError(requestError.message) }
  }
  const updateStatus = async (order, status) => {
    try { const updated = await adminApi(`/orders/${order._id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setOrders((items) => items.map((item) => item._id === updated._id ? updated : item)) } catch (requestError) { setError(requestError.message) }
  }
  if (!authorized) return <main className="admin-page"><section className="admin-login"><p className="eyebrow">PRIVATE STORE ACCESS</p><h1>Admin <i>sign in.</i></h1><p>Sign in with your store administrator account.</p><form onSubmit={(event) => { event.preventDefault(); loadAdmin() }}><input aria-label="Admin username" name="username" autoComplete="username" placeholder="Username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required /><input aria-label="Admin password" type="password" name="password" autoComplete="current-password" placeholder="Password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /><button className="button button-burgundy" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} <span>↗</span></button></form>{error && <p className="admin-error">{error}</p>}</section></main>
  return <main className="admin-page"><div className="admin-heading"><div><p className="eyebrow">LIBASSI · STORE MANAGEMENT</p><h1>Good morning.<br /><i>Here is your shop.</i></h1></div><button className="admin-live" onClick={async () => { await adminApi('/admin/logout', { method: 'POST' }); setAuthorized(false); setCredentials({ username: '', password: '' }) }}>Sign out</button></div>{error && <p className="admin-error">{error}</p>}<div className="stat-grid"><div><span>Orders</span><b>{orders.length}</b><small>All time</small></div><div><span>Revenue</span><b>{money(revenue)}</b><small>Confirmed and fulfilled</small></div><div><span>Pieces</span><b>{products.length}</b><small>In the collection</small></div></div>
    <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">FULFILMENT</p><h2>Recent orders</h2></div></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>{orders.length ? orders.slice(0, 12).map((order) => <tr key={order._id}><td>#{String(order._id).slice(-7).toUpperCase()}</td><td>{order.customer_name}<small>{order.city} · {order.phone_number}</small></td><td>{new Date(order.created_at || order.createdAt).toLocaleDateString('en-GB')}</td><td>{money(order.total_amount_mad)}</td><td>{order.payment_method}<small>{order.payment_status || 'Unpaid'}</small></td><td><select className="status-select" value={order.status} onChange={(event) => updateStatus(order, event.target.value)}><option>Pending</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option></select></td></tr>) : <tr><td colSpan="6" className="table-empty">New orders will appear here.</td></tr>}</tbody></table></div></section>
    <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">THE CATALOGUE</p><h2>{editing ? 'Edit a piece' : 'Add a piece'}</h2></div></div><form className="product-editor" onSubmit={saveProduct}><input aria-label="Product name" placeholder="Product name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /><select aria-label="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option value="women">Women</option><option value="men">Men</option><option value="accesories">Accessories</option></select><input aria-label="Colour" placeholder="Colour" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} required /><input aria-label="Price in MAD" placeholder="Price (MAD)" type="number" min="1" value={draft.price_mad} onChange={(event) => setDraft({ ...draft, price_mad: event.target.value })} required /><input aria-label="Image URL" placeholder="Image URL, e.g. /images/djellaba.jpg" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} required /><input aria-label="Sizes" placeholder="Sizes, comma separated" value={Array.isArray(draft.sizes) ? draft.sizes.join(', ') : draft.sizes} onChange={(event) => setDraft({ ...draft, sizes: event.target.value.split(',').map((item) => item.trim()) })} /><textarea aria-label="Product description" placeholder="Description" rows="2" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /><label><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })} /> Featured</label><label><input type="checkbox" checked={draft.is_bestseller} onChange={(event) => setDraft({ ...draft, is_bestseller: event.target.checked })} /> Bestseller</label><div className="editor-actions"><button className="button button-burgundy">{editing ? 'Save changes' : 'Add to collection'}</button>{editing && <button type="button" className="text-link" onClick={() => { setEditing(null); setDraft(emptyProduct) }}>Cancel edit</button>}</div></form><div className="admin-products">{products.map((product) => <div key={product.id}><img src={product.image_url} alt="" /><span>{product.name}<small>{money(product.price_mad)} · {product.color}</small></span><button onClick={() => editProduct(product)}>Edit</button><button onClick={() => removeProduct(product)} aria-label={`Remove ${product.name}`}>Remove</button></div>)}</div></section>
  </main>
}

function Footer() {
  return <footer className="site-footer"><div className="footer-top"><Link to="/" className="wordmark footer-wordmark">LIBASSI<span>MADE OF MOROCCO</span></Link><p>Clothing that carries<br />a little piece of home.</p><div className="footer-nav"><Link to="/category/men">Men</Link><Link to="/category/women">Women</Link><Link to="/category/accessories">Accessories</Link><Link to="/admin">Admin</Link><a href="mailto:hello@libassi.ma">Contact</a></div></div><div className="footer-bottom"><span>© 2026 LIBASSI · CASABLANCA, MOROCCO</span><span>PAY ON DELIVERY · COMPLIMENTARY SHIPPING</span></div></footer>
}

export default function App() {
  return <BrowserRouter><AppFrame /></BrowserRouter>
}
