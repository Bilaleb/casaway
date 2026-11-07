const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

export function setupRouteEditor({
  actions,
  editButton,
  deleteButton,
  dialog,
  form,
  cancelButton,
  saveButton,
  getRoute,
  onUpdate,
  onDelete,
  setStatus,
  t,
}) {
  function selectedRoute() {
    const route = getRoute()
    return route && OBJECT_ID_PATTERN.test(String(route.id)) ? route : null
  }

  function refreshActions() {
    actions.hidden = !selectedRoute()
  }

  function token() {
    return window.prompt(t('tokenPrompt'))?.trim() || null
  }

  editButton.addEventListener('click', () => {
    const route = selectedRoute()
    if (!route) return
    form.elements.name.value = route.title || ''
    form.elements.depotName.value = route.depotName || route.origin || ''
    form.elements.district.value = route.district || ''
    form.elements.taxiType.value = route.taxiType || 'Grand Taxi'
    form.elements.trajectory.value = JSON.stringify({
      type: 'LineString',
      coordinates: route.trajectory || [],
    }, null, 2)
    dialog.showModal()
  })

  cancelButton.addEventListener('click', () => dialog.close())

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const route = selectedRoute()
    if (!route || !form.reportValidity()) return

    let trajectory
    try {
      trajectory = JSON.parse(form.elements.trajectory.value)
    } catch {
      setStatus(t('invalidGeoJson'), { error: true })
      return
    }
    const coordinates = trajectory?.coordinates
    if (trajectory?.type !== 'LineString' || !Array.isArray(coordinates) || coordinates.length < 2) {
      setStatus(t('invalidGeoJson'), { error: true })
      return
    }

    const writeToken = token()
    if (!writeToken) return
    saveButton.disabled = true
    try {
      const response = await fetch(`/api/routes/${encodeURIComponent(route.id)}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${writeToken}`,
        },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          depotName: form.elements.depotName.value.trim(),
          district: form.elements.district.value.trim(),
          taxiType: form.elements.taxiType.value,
          trajectory,
        }),
      })
      if (!response.ok) throw new Error(t('routeWriteFailed'))
      const updated = await response.json()
      onUpdate(updated)
      dialog.close()
      setStatus(t('routeSaved'))
    } catch {
      setStatus(t('routeWriteFailed'), { error: true })
    } finally {
      saveButton.disabled = false
    }
  })

  deleteButton.addEventListener('click', async () => {
    const route = selectedRoute()
    if (!route || !window.confirm(t('confirmDelete', route.title))) return
    const writeToken = token()
    if (!writeToken) return

    deleteButton.disabled = true
    try {
      const response = await fetch(`/api/routes/${encodeURIComponent(route.id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${writeToken}` },
      })
      if (!response.ok) throw new Error(t('routeWriteFailed'))
      onDelete(route.id)
      setStatus(t('routeDeleted'))
    } catch {
      setStatus(t('routeWriteFailed'), { error: true })
    } finally {
      deleteButton.disabled = false
    }
  })

  return { refreshActions }
}