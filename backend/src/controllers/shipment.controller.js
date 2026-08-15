const {
  createShipment,
  listShipments,
  getShipmentById,
  updateShipment,
  markShipped,
  cancelShipment,
  ShipmentError,
} = require('../services/shipment.service');
const { handleAccess } = require('../lib/access');

function handleError(res, error) {
  if (handleAccess(res, error)) return;
  if (error instanceof ShipmentError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro de envio:', error);
  return res.status(500).json({ error: 'Erro ao processar envio' });
}

class ShipmentController {
  async list(req, res) {
    try {
      const result = await listShipments({
        companyId: req.companyId,
        status: req.query.status,
        origin: req.query.origin,
        search: req.query.search,
        unitId: req.query.unitId,
        page: req.query.page,
        limit: req.query.limit,
        user: req.user,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const shipment = await getShipmentById({
        companyId: req.companyId,
        id: req.params.id,
        user: req.user,
      });
      return res.json(shipment);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async create(req, res) {
    try {
      const shipment = await createShipment({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        unitId: req.body.unitId || req.headers['x-unit-id'],
        saleId: req.body.saleId,
        clientId: req.body.clientId,
        origin: req.body.origin || 'manual',
        recipientName: req.body.recipientName,
        phone: req.body.phone,
        document: req.body.document,
        address: req.body.address,
        complement: req.body.complement,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        itemsNote: req.body.itemsNote,
        carrier: req.body.carrier,
        notes: req.body.notes,
      });
      return res.status(201).json(shipment);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async update(req, res) {
    try {
      const shipment = await updateShipment({
        companyId: req.companyId,
        id: req.params.id,
        payload: req.body,
        user: req.user,
      });
      return res.json(shipment);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async ship(req, res) {
    try {
      const shipment = await markShipped({
        companyId: req.companyId,
        id: req.params.id,
        trackingCode: req.body.trackingCode,
        carrier: req.body.carrier,
        user: req.user,
      });
      return res.json(shipment);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async cancel(req, res) {
    try {
      const shipment = await cancelShipment({
        companyId: req.companyId,
        id: req.params.id,
        user: req.user,
      });
      return res.json(shipment);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new ShipmentController();
