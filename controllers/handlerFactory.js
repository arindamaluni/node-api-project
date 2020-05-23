const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

//Dynamically construct document name for json
const formatResponse = (doc) => {
  const docName = doc.constructor.modelName.toLowerCase();
  const responseMsg = { status: 'success', data: {} };
  responseMsg.data[docName] = doc;
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
