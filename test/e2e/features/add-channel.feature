@chat-add-channel
Feature: As a user of Open-Paas, on the linagora.esn.chat module,
    I want to be able to create a new Channel

    Background:
        Given I logged in to OpenPaas
        And I use a desktop screen

    Scenario: User can see Channel Creation form
        Given I am on Chat module page
        When I click on Add Channel button
        Then I am redirected to Add Channel page
            And I see Add Channel form
            
    Scenario: User can add a new Channel
        Given I am on Chat module page
        When I click on Add Channel button
            And I fill name with "new channel!"
            And I fill topic with "some topic"
            And I fill purpose with "any purpose"
            And I click on Create Channel button
        Then the new Channel is added and selected with name "new channel!"