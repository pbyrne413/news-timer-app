import { BaseController } from './BaseController.js';

export class SourceController extends BaseController {
  constructor(container) {
    super(container);
    this.sourceService = container.get('sourceService');
  }

  // GET /api/sources - List all sources with usage
  getSources = this.createHandler(async (req, res) => {
    const sources = await this.sourceService.getSourcesWithUsage();
    this.sendSuccess(res, sources);
  });

  // POST /api/sources - Add new source
  addSource = this.createHandler(async (req, res) => {
    const newSource = await this.sourceService.addSource(req.body);
    this.sendSuccess(res, newSource, 201);
  });

  // Combined handler for both GET and POST
  handleSources = this.createHandler(async (req, res) => {
    if (req.method === 'GET') {
      return this.getSources(req, res);
    } else if (req.method === 'POST') {
      return this.addSource(req, res);
    } else {
      return this.sendMethodNotAllowed(res, ['GET', 'POST']);
    }
  });

  // PUT /api/sources/:sourceKey/allocation - Update allocation
  updateAllocation = this.createHandler(async (req, res) => {
    const { sourceKey } = req.params;
    const { allocation } = req.body;
    
    const result = await this.sourceService.updateSourceAllocation(sourceKey, allocation);
    this.sendSuccess(res, result);
  });

  // DELETE /api/sources/:sourceKey - Delete source
  deleteSource = this.createHandler(async (req, res) => {
    const { sourceKey } = req.params;
    
    const result = await this.sourceService.deleteSource(sourceKey);
    this.sendSuccess(res, result);
  });
}
