
import models from '../models'

export default {
  clearDb: done =>  {
    return models.sequelize.sync({force: true})
      .then(() => {
        if (done) done()
      })
  },
  mockHttpClient: {
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: () => {} } },
  },
  jwts: {
    // userId = 40051332,roles: [ 'Topcoder copilot' ],handle: 'test1',email: 'test@topcoder.com'
    copilot: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiQ29ubmVjdCBDb3BpbG90Il0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6InRlc3QxIiwiZXhwIjoyNTYzMDc2Njg5LCJ1c2VySWQiOjQwMDUxMzMyLCJlbWFpbCI6InRlc3RAdG9wY29kZXIuY29tIiwiaWF0IjoxNDcwNjIwMDQ0fQ.hDf2lcU9qX__FrOGoTsqE8d_EOf8l9hu_OEE0v4JCA8',
    // userId = 40051331, [ 'Topcoder User' ],handle: 'test1',email: 'test@topcoder.com'
    member: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6InRlc3QxIiwiZXhwIjoyNTYzMDc2Njg5LCJ1c2VySWQiOiI0MDA1MTMzMSIsImlhdCI6MTQ2MzA3NjA4OSwiZW1haWwiOiJ0ZXN0QHRvcGNvZGVyLmNvbSIsImp0aSI6ImIzM2I3N2NkLWI1MmUtNDBmZS04MzdlLWJlYjhlMGFlNmE0YSJ9.IgPq3dcPH-WJXQAytjF_4fJbx3gtsee1U3vmqGIGoUA',
    // userId = 40051332, roles: [ 'Manager', 'Topcoder User' ],handle: 'test1',email: 'test@topcoder.com'
    manager: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiTWFuYWdlciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzIiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.bzwlGy_lPiPjVpMYPkkQr3-fvfTwg6qbTKRVCUe0qrw',
    // userId = 40051333, roles: [ 'administrator', 'Topcoder User' ],handle: 'test1',email: 'test@topcoder.com'
    admin: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci5jb20iLCJoYW5kbGUiOiJ0ZXN0MSIsImV4cCI6MjU2MzA3NjY4OSwidXNlcklkIjoiNDAwNTEzMzMiLCJpYXQiOjE0NjMwNzYwODksImVtYWlsIjoidGVzdEB0b3Bjb2Rlci5jb20iLCJqdGkiOiJiMzNiNzdjZC1iNTJlLTQwZmUtODM3ZS1iZWI4ZTBhZTZhNGEifQ.yG7pd9_UUFGo6XFH7-H6Wd5wWzRivkeZTCyet7IXFso'
  }
}
