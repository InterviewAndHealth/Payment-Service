const joi = require("joi")

class Validator {
  createCheckoutSessionSchema = joi.object().keys({
    product: {
      id: joi.string().required(),
      price_id: joi.string().allow("", null).optional(),
      quantity: joi.number().required(),
      price: joi.number().required(),
      currency: joi.string().required(),
      package_type: joi.string().required(),
      name: joi.string().required(),
    },
    successUrl: joi.string().required(),
    cancelUrl: joi.string().required(),
    number_of_interviews: joi.number().required(),
    promocode: joi.string().allow("", null).optional(),
  })

  updateSubscriptionSchema = joi.object().keys({
    product: {
      id: joi.string().required(),
      price_id: joi.string().required(),
      price: joi.number().required(),
      currency: joi.string().required(),
      package_type: joi.string().required(),
      name: joi.string().required(),
    },
  })

  saveBillingInfoSchema = joi.object().keys({
    billingAddress1: joi.string().required(),
    billingAddress2: joi.string().required(),
    billingTo: joi.string().required(),
    companyName: joi.string().required(),
    promoCode: joi.string().allow("", null).optional(),
  })

  createPromocodeSchema = joi.object().keys({
    code: joi.string().required(),
    discount_value: joi.number().required(),
    expiration_date: joi.date().required(),
    role: joi.string().required(),
    is_active: joi.boolean().required(),
    promo_code_type: joi.string().required(),
    currency: joi.string().required(),
  })

  applyPromocodeSchema = joi.object().keys({
    promocode: joi.string().required(),
    currency: joi.string().required(),
  })
}

module.exports = Validator
