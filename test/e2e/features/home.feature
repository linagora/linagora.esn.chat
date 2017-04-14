@chat-home
Feature: As a user of Open-Paas, on the linagora.esn.chat module,
    I want to be able to see chat homepage

    Background:
        Given I logged in to OpenPaas
        And I use a desktop screen

    Scenario: User can see Channel List
        Given I am on Chat module page
        Then I can see Channel List