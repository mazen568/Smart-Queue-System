type role = "admin" | "reception"

export interface User {
    id: string ,
    name: string,
    email: string,
    role: role ,
    clinicId:string ,
    accessToken: string
}