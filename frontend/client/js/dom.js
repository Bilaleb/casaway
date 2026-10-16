/**
 * Tiny DOM builder. Every value is written with textContent, so station names,
 * destinations and route labels can never be interpreted as markup.
 */
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag)
  const { className, text, attrs = {}, dataset = {}, on = {}, style = {} } = options

  if (className) node.className = className
  if (text !== undefined && text !== null) node.textContent = String(text)

  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === undefined || value === null) continue
    node.setAttribute(name, value === true ? '' : String(value))
  }
  for (const [name, value] of Object.entries(dataset)) node.dataset[name] = String(value)
  for (const [name, value] of Object.entries(style)) node.style.setProperty(name, value)
  for (const [event, handler] of Object.entries(on)) node.addEventListener(event, handler)

  appendChildren(node, children)
  return node
}

export function appendChildren(node, children) {
  const list = Array.isArray(children) ? children : [children]
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

export function clearNode(node) {
  node.replaceChildren()
  return node
}

export function replaceChildren(node, children) {
  node.replaceChildren()
  appendChildren(node, children)
  return node
}

export function joinWithSeparator(items, separator = ' · ') {
  return items.filter(Boolean).join(separator)
}
