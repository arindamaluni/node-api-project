const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const tour = await Model.findByIdAndDelete(req.params.id);
    if (!tour) {
      return next(
        new AppError(
          `No ${Model.collection.collectionName} found for id: ${req.params.id}`,
          404
        )
      );
    }
    res.status(204).json({ status: 'success', data: { tour } });
  });
