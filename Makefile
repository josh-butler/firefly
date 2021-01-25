.PHONY: all \
npmi test coverage unit \
invoke api sam-clean sam-build

-include Makefile.env

ROOT_PATH=$(PWD)
SRC_PATH=$(ROOT_PATH)/src
BUILD_PATH=$(ROOT_PATH)/.aws-sam/build
BIN:=$(ROOT_PATH)/node_modules/.bin
ESLINT=$(BIN)/eslint
JEST=$(BIN)/jest

APP_NAME?=firefly
APP_BUCKET?=lambdadeploys
APP_ENVIRONMENT?=dev
AWS_REGION?=us-east-1
AWS_OPTIONS=

SAM_LOCAL_PARAMS?=ParameterKey=Stage,ParameterValue=$(APP_ENVIRONMENT)
LAMBDA_EVENT?=events/event.json
LAMBDA_ENV?=.env.local.json

ifdef AWS_PROFILE
AWS_OPTIONS=--profile $(AWS_PROFILE)
endif

define ENV_LOCAL_JSON
{
  "GetStatus": {
    "TABLE_NAME": "test"
  }
}
endef
export ENV_LOCAL_JSON

define EVENT_LOCAL_JSON
{
	"Records": [
		{
			"messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
			"receiptHandle": "MessageReceiptHandle",
			"body": "{\"externalRefId\":\"VAST_ABC123\",\"taskToken\":\"YXNmc2RhZnMzd3E0M2V3dGZ2Y2Eg\",\"jobs\":[{\"s3Path\":\"s3:\/\/fake_path\",\"testPlan\":\"TACT_mezz\",\"testPlanVersionNum\":0},{\"s3Path\":\"s3:\/\/fake_path\",\"testPlan\":\"TACT_low\",\"testPlanVersionNum\":0}]}",
			"attributes": {
				"ApproximateReceiveCount": "1",
				"SentTimestamp": "1523232000000",
				"SenderId": "123456789012",
				"ApproximateFirstReceiveTimestamp": "1523232000001"
			},
			"messageAttributes": {},
			"md5OfBody": "7b270e59b47ff90a553787216d55d91d",
			"eventSource": "aws:sqs",
			"eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
			"awsRegion": "us-east-1"
		}
	]
}
endef
export EVENT_LOCAL_JSON


all: unit

# test: lint coverage ## Run code linter, unit tests and code coverage report
test: unit ## Run unit tests and code coverage report

help: ## Describe all available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

clean: ## Delete local artifacts
	rm -rf coverage

npmi: ## Install npm dependencies
	npm i

local-init: ## Generate initial local dev support files 
	@if [ ! -f ./Makefile.env ]; then \
		echo "AWS_PROFILE=default\nLAMBDA_NAME=postJobLambda\nTEST_NAME=test" > ./Makefile.env; \
	fi

	@if [ ! -f $(LAMBDA_ENV) ]; then \
		echo "$$ENV_LOCAL_JSON" > $(LAMBDA_ENV); \
	fi

	@if [ ! -d ./events ]; then \
		mkdir ./events && echo "$$EVENT_LOCAL_JSON" > ./events/event.json; \
	fi

lint: ## Run code linter
	@echo "Linting code..."
	@$(ESLINT) --quiet --ext .js $(SRC_PATH)
	@echo "Linting PASSED"

unit: ## Run unit tests
	@echo "Running unit tests..."
	@$(JEST)

coverage: ## Run unit tests & coverage report
	@echo "Running unit tests and coverage..."
	@$(JEST) --coverage

test-single: ## Run unit tests
	@echo "Running single unit test/suite..."
	@$(JEST) --coverage=false -t $(TEST_NAME)

invoke: sam-clean ## Invoke individual Lambda
	sam local invoke $(LAMBDA_NAME) --parameter-overrides $(SAM_LOCAL_PARAMS) --event $(LAMBDA_EVENT) --env-vars $(LAMBDA_ENV) $(AWS_OPTIONS)

api: sam-clean ## Start the API GW locally
	sam local start-api --parameter-overrides $(SAM_LOCAL_PARAMS) --env-vars $(LAMBDA_ENV) $(AWS_OPTIONS)

deploy: sam-build sam-package sam-deploy ## Deploy SAM app using local code

sam-install: # CICD only
	pip install --upgrade pip
	pip install aws-sam-cli

sam-clean: ## Delete local artifacts
	rm -rf .aws-sam

sam-build:
	sam build

sam-package:
	cd $(BUILD_PATH) && sam package \
	--template-file template.yaml \
	--s3-bucket $(APP_BUCKET) \
	--output-template-file packaged.yaml \
	$(AWS_OPTIONS)

sam-deploy: 
	cd $(BUILD_PATH) && sam deploy \
	--template-file packaged.yaml \
	--stack-name $(APP_NAME)-$(APP_ENVIRONMENT) \
	--capabilities CAPABILITY_NAMED_IAM \
	$(AWS_OPTIONS)

install: download-aspec sam-install npmi # Optional rule intended for use in the CICD environment
	@echo INSTALL phase completed `date`

pre-build: test # Optional rule intended for use in the CICD environment
	@echo PRE_BUILD phase completed `date`

build: sam-build sam-package # Optional rule intended for use in the CICD environment
	@echo BUILD phase completed `date`

post-build: sam-deploy # Optional rule intended for use in the CICD environment
	@echo POST_BUILD phase completed `date`

get-token:
	@echo getting token
	aws cognito-idp initiate-auth --cli-input-json file://cognito-auth.json