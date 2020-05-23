const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');

//Dynamically construct document name for json
const formatResponse = (doc) => {
  const docName = doc.constructor.modelName
    ? doc.constructor.modelName.toLowerCase()
    : 'doc';
  const responseMsg = { status: 'success', count: null, data: {} };
  responseMsg.data[docName] = doc;
  responseMsg.count = doc.length > 1 ? doc.length : undefined;
  return responseMsg;
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(
          `No ${Model.collection.collectionName} found for id: ${req.params.id}`,
          404
        )
      );
    }
    res.status(204).json(formatResponse(doc));
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(
          `No ${Model.collection.collectionName} found for id: ${req.params.id}`,
          404
        )
      );
    }
    res.status(201).json(formatResponse(doc));
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json(formatResponse(doc));
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (populateOptions) query.populate(populateOptions);
    const doc = await query;
    if (!doc) {
      return next(
        new AppError(
          `No ${Model.collection.collectionName} found for id: ${req.params.id}`,
          404
        )
      );
    }
    res.status(200).json(formatResponse(doc));
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //Hack:If gettting redirected from tourRouter for all reviews under a given tour
    //Add the filter for tour
    if (req.params.tourId) req.query.tour = req.params.tourId;
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //EXECUTE QUERY
    const doc = await features.query;
    //SEND RESPONSE
    res.status(200).json(formatResponse(doc));
  });
