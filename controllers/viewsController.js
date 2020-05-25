exports.getOverview = (req, res) => {
  res.status(200).render('overview', { title: 'All Tours' });
};

exports.getTourDetails = (req, res) => {
  res.status(200).render('tour', { title: 'The Forest Hiker' });
};
