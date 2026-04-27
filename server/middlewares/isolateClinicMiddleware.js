export const isolateClinic = (Model) => async (req, res, next) => {
    const resource = await Model.findById(req.params.id);
  
    if (!resource) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
  
    if (resource.clinicId.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  
    next();
};