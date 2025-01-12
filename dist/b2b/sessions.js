"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sessions = void 0;

var _shared = require("../shared");

var _sessions = require("../shared/sessions");

const organizationClaim = "https://stytch.com/organization";

class Sessions {
  base_path = "sessions";

  constructor(fetchConfig, jwtConfig) {
    this.fetchConfig = fetchConfig;
    this.jwksClient = jwtConfig.jwks;
    this.jwtOptions = {
      audience: jwtConfig.projectID,
      issuer: `stytch.com/${jwtConfig.projectID}`,
      typ: "JWT"
    };
  }

  endpoint(path) {
    return `${this.base_path}/${path}`;
  }

  get({
    organization_id,
    member_id
  }) {
    return (0, _shared.request)(this.fetchConfig, {
      method: "GET",
      url: this.base_path,
      params: {
        organization_id,
        member_id
      }
    });
  }

  jwks(project_id) {
    return (0, _shared.request)(this.fetchConfig, {
      method: "GET",
      url: this.endpoint(`jwks/${project_id}`)
    });
  }

  authenticate(data) {
    return (0, _shared.request)(this.fetchConfig, {
      method: "POST",
      url: this.endpoint("authenticate"),
      data
    });
  }
  /** Parse a JWT and verify the signature, preferring local verification over remote.
   *
   * If max_token_age_seconds is set, remote verification will be forced if the JWT was issued at
   * (based on the "iat" claim) more than that many seconds ago.
   *
   * To force remote validation for all tokens, set max_token_age_seconds to zero or use the
   * authenticate method instead.
   */


  async authenticateJwt(jwt, options) {
    try {
      const member_session = await this.authenticateJwtLocal(jwt, options);
      return {
        member_session,
        session_jwt: jwt
      };
    } catch (err) {
      // JWT could not be verified locally. Check with the Stytch API.
      return this.authenticate({
        session_jwt: jwt
      });
    }
  }
  /** Parse a JWT and verify the signature locally (without calling /authenticate in the API).
   *
   * If maxTokenAge is set, this will return an error if the JWT was issued (based on the "iat"
   * claim) more than maxTokenAge seconds ago.
   *
   * If max_token_age_seconds is explicitly set to zero, all tokens will be considered too old,
   * even if they are otherwise valid.
   *
   * The value for current_date is used to compare timestamp claims ("exp", "nbf", "iat"). It
   * defaults to the current date (new Date()).
   *
   * The value for clock_tolerance_seconds is the maximum allowable difference when comparing
   * timestamps. It defaults to zero.
   */


  async authenticateJwtLocal(jwt, options) {
    const sess = await (0, _sessions.authenticateJwtLocal)(this.jwksClient, this.jwtOptions, jwt, options);
    const {
      [organizationClaim]: orgClaimUntyped,
      ...claims
    } = sess.custom_claims;
    const orgClaim = orgClaimUntyped;
    return {
      member_session_id: sess.session_id,
      member_id: sess.sub,
      organization_id: orgClaim.organization_id,
      authentication_factors: sess.authentication_factors,
      started_at: sess.started_at,
      last_accessed_at: sess.last_accessed_at,
      expires_at: sess.expires_at,
      custom_claims: claims
    };
  }

  exchange(data) {
    return (0, _shared.request)(this.fetchConfig, {
      method: "POST",
      url: this.endpoint("exchange"),
      data
    });
  }

  revoke(data) {
    return (0, _shared.request)(this.fetchConfig, {
      method: "POST",
      url: this.endpoint("revoke"),
      data
    });
  }

}

exports.Sessions = Sessions;