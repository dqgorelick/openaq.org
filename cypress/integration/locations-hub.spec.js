// / <reference types="Cypress" />

describe('The Locations Hub', () => {
  before(() => {
    cy.visit('/#/locations');
  });

  it('successfully loads', () => {
    cy.get('header');
    cy.get('main');
    cy.get('footer');
    cy.get('h1');
  });

  it('has a header with title and description', () => {
    cy.get('h1').should('contain', 'Locations');
    cy.get('.inpage__introduction').should(
      'contain',
      'Lorem ipsum dolor sit amet'
    );
  });

  it('has a results section with a list of location cards', () => {
    cy.get('.results-summary')
      .invoke('text')
      .should('match', /A total of \d+ locations were found/);

    cy.get('.card').should('have.length', 15);
    cy.get('.pagination').should('exist');
  });

  it('has some filters with dropdown menus', () => {
    cy.get('.filters').should('exist');

    // country filter
    cy.get('[title="country__filter"]').click();
    cy.get('[data-cy=filter-countries]')
      .contains('li', 'Australia')
      .should('length', 1);
    cy.get('[data-cy=filter-menu-item]').first().click();

    cy.get('.button--filter-pill').should('exist');

    cy.get('button').contains('Clear Filters').should('exist');
    cy.get('button').contains('Clear Filters').click();

    // parameter filter
    cy.get('[title="type__filter"]').click();
    cy.get('[data-cy=filter-parameters]')
      .contains('li', 'BC')
      .should('length', 1);
    cy.get('[data-cy=filter-menu-item]').first().click();

    cy.get('.button--filter-pill').should('exist');

    cy.get('button').contains('Clear Filters').should('exist');
    cy.get('button').contains('Clear Filters').click();

    // source filter
    cy.get('[title="source__filter"]').click();
    cy.get('[data-cy=filter-sources]')
      .contains('li', 'AirNow')
      .should('length', 1);
    cy.get('[data-cy=filter-menu-item]').first().click();

    cy.get('[data-cy=filter-pill]').should('exist');

    cy.get('[data-cy=filter-clear]').contains('Clear Filters').should('exist');
    cy.get('[data-cy=filter-clear]').click();
  });
});
