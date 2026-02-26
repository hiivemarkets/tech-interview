# frozen_string_literal: true

class GraphqlChannel < ApplicationCable::Channel
  def subscribed
    @subscription_ids = []
  end

  def execute(data)
    result = AuctionApiRbSchema.execute(
      query: data["query"],
      context: subscription_context,
      variables: ensure_hash(data["variables"]),
      operation_name: data["operationName"]
    )

    payload = { result: result.to_h, more: result.subscription? }

    @subscription_ids << result.context[:subscription_id] if result.context[:subscription_id]

    transmit(payload)
  end

  def unsubscribed
    @subscription_ids.each do |sid|
      AuctionApiRbSchema.subscriptions.delete_subscription(sid)
    end
  end

  private

  def subscription_context
    {
      channel: self,
      current_user: current_user
    }
  end

  def current_user
    User.find_by(id: params[:user_id])
  end

  def ensure_hash(ambiguous_param)
    case ambiguous_param
    when String
      ambiguous_param.present? ? JSON.parse(ambiguous_param) : {}
    when Hash, ActionController::Parameters
      ambiguous_param
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{ambiguous_param}"
    end
  end
end
