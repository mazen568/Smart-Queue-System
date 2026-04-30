type role = "admin" | "reception"

export interface User {
    _id?: string,
    id: string,
    name: string,
    email: string,
    role: role,
    clinicId: string,
    accessToken: string
}