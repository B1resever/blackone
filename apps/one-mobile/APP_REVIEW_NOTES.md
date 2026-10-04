# ONE App Review Notes

ONE is the BLACK ONE application for scheduled professional transportation.

## Reviewer access
Reviewer credentials are configured only in the production environment and must be entered directly in App Store Connect or Google Play Console. They are not stored in this repository.

A production review fixture can create:
- a passenger reviewer account
- a driver reviewer account
- reservation code ONE-APP-REVIEW
- ride code ONE246

## Passenger review path
1. Sign in through My ONE.
2. Open My Reservations.
3. Open ONE-APP-REVIEW.
4. Review assigned driver and vehicle.
5. Open Secure Chat and ONE Live Tracking.
6. Review the ride code.
7. Open Support / SOS.
8. Review Privacy, Terms, and Delete Account.

## Driver review path
1. Sign in using the dedicated driver reviewer account.
2. Open Driver Trips.
3. Open ONE-APP-REVIEW.
4. Start foreground live location if location permission is granted.
5. Move the trip to Arrived.
6. Verify ride code ONE246.
7. Move to Passenger Onboard and Complete.

## Location
ONE requests foreground location only when a driver explicitly starts live location sharing for an active assigned trip. Stage 1 does not request background location and does not continuously collect passenger GPS.

## Public URLs
Support: https://blackonetransportation.com/support.html
Privacy: https://blackonetransportation.com/privacy.html
Terms: https://blackonetransportation.com/terms.html
Account deletion: https://blackonetransportation.com/delete-account.html
