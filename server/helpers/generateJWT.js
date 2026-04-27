import jsonwebtoken from 'jsonwebtoken';

export function generateAccessToken(user) {
    return jsonwebtoken.sign({
        _id: user._id,
        clinicId:user.clinicId,
        role:user.role
    },process.env.JWT_SECRET, {
        expiresIn:"15m"
    })
}

export function generateRefreshToken(user) {
    return jsonwebtoken.sign({
        _id: user._id,
        clinicId:user.clinicId,
        role:user.role
    },process.env.JWT_SECRET, {
        expiresIn:"7d"
    })
}