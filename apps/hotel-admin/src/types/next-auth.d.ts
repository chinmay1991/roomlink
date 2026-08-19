import 'next-auth'

declare module 'next-auth' {
  interface User {
    userType: string
    roleId: string
    roleName: string | null
    hotelId: string
    hotelName: string | null
  }

  interface Session {
    user: {
      id: string
      userType: string
      roleId: string
      roleName: string | null
      hotelId: string
      hotelName: string | null
      name?: string | null
      email?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    userType: string
    roleId: string
    roleName: string | null
    hotelId: string
    hotelName: string | null
  }
}
